import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { Effect, Exit, Layer, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { TransactionLive } from '~api/lib/transaction.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import { submitAnswer } from '~api/modules/written-study/application/submit-answer.command.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const failingCoverageLayer = Layer.effect(
  StudyRepository,
  Effect.gen(function* () {
    const studyRepository = yield* StudyRepository
    const missingRevision = yield* Schema.decodeEffect(QuestionRevisionId)(crypto.randomUUID())

    return StudyRepository.of({
      ...studyRepository,
      recordCoverage: (userId, pathId, questionId, _revisionId, round) =>
        studyRepository.recordCoverage(userId, pathId, questionId, missingRevision, round),
    })
  }),
).pipe(Layer.provide(StudyRepositoryLive))

const commandLayer = Layer.mergeAll(
  TransactionLive,
  failingCoverageLayer,
  StudyReaderLive,
  ReviewSchedulerLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
).pipe(Layer.provideMerge(databaseLayerFromConfig))

test('a failure inside the answer transaction keeps no answer or progress, and a retry succeeds', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  await addFixtureQuestion(fixture.pathId, fixture.documentId)
  await addFixtureQuestion(fixture.pathId, fixture.documentId)
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const session = Schema.decodeUnknownSync(StudySession)(
    await (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount: 2,
        questionSelection: 'uncovered',
      })
    ).json(),
  )

  const readQuestion = async () =>
    Schema.decodeUnknownSync(SessionQuestion)(
      await (await request(`/sessions/${session.id}/questions/1`)).json(),
    )

  const question = await readQuestion()
  const answer = question.answers[0]!

  const exit = await Effect.runPromiseExit(
    submitAnswer(
      visitor.userId,
      fixture.pathId,
      session.id,
      question.position,
      question.questionRevisionId,
      answer.id,
    ).pipe(Effect.provide(commandLayer), Effect.scoped),
  )

  expect(Exit.isFailure(exit)).toBe(true)
  expect(JSON.stringify(exit)).toContain('StudyWriteError')
  expect((await readQuestion()).answer).toBeNull()
  expect(
    Schema.decodeUnknownSync(StudySession)(await (await request(`/sessions/${session.id}`)).json())
      .progress,
  ).toMatchObject({ answered: 0, currentQuestion: 1 })
  expect(await (await request(`/documents/${fixture.documentId}`)).json()).toMatchObject({
    document: { completedQuestionCount: 0 },
  })

  const retried = await request(`/sessions/${session.id}/questions/1/answer`, {
    questionRevisionId: question.questionRevisionId,
    answerId: answer.id,
  })

  expect(retried.status).toBe(200)
  expect(
    Schema.decodeUnknownSync(StudySession)(await (await request(`/sessions/${session.id}`)).json())
      .progress.answered,
  ).toBe(1)
})
