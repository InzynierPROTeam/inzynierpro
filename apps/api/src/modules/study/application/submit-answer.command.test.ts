import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { SessionQuestion, StudySession } from '@inzpro/api-contracts/modules/study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { Effect, Exit, Layer, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureQuestion,
  createStudyFixture,
  studySessionSpecialization,
} from '~api/test/learning-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

import { StudyRepository } from './study.repository.js'
import { submitAnswer } from './submit-answer.command.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

// The real adapters, except that recording coverage, written after the answer and its event,
// names a revision that does not exist, so PostgreSQL rejects it after the answer and its
// LearningEvent were already inserted.
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
  failingCoverageLayer,
  StudyReaderLive,
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
