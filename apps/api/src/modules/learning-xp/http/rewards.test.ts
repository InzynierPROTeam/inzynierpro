import {
  type LearningRewards,
  LearningXpResponse,
} from '@inzpro/api-contracts/modules/learning-xp/responses'
import { FinishMockExamAttemptResponse } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  DocumentsResponse,
  EndSessionResponse,
  SessionPreview,
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { DateTime, Effect, Layer, Option, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { XpReader } from '~api/modules/learning-xp/application/learning-xp.reader.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { catalogueTestTime } from '~api/test/clock.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { mockExamLearner } from '~api/test/mock-exam-learner.js'
import {
  createStudyFixture,
  seededFixturePath,
  studySessionSpecialization,
} from '~api/test/preparation-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  smallPathConfiguration,
} from '~api/test/preparation.js'
import { qualifyFixtureDay } from '~api/test/streak-fixtures.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const learningXpOf = async (visitor: TestVisitor) =>
  decode(LearningXpResponse)(await visitor.jar.fetch(new URL('/api/v1/learning-xp', api.baseUrl)))

const badgeCodesOf = async (visitor: TestVisitor) =>
  (await learningXpOf(visitor)).badges.map(({ code }) => code).sort()

const grantedBadgeCodes = (rewards: ReadonlyArray<LearningRewards>) =>
  rewards.flatMap(({ badges }) => badges.map(({ code }) => code)).sort()

const writtenLearner = async <
  Fixture extends {
    readonly pathId: string
    readonly config: CompleteOnboardingPayload
  },
>(
  fixture: Fixture,
) => {
  const visitor = await loginForPreparation(api)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const start = async (documentId: string) => {
    const offered = await decode(SessionPreview)(await request(`/preview?documentId=${documentId}`))

    return decode(StudySession)(
      await request('/sessions', {
        documentId,
        questionCount: offered.availableQuestionCount,
        questionSelection: offered.questionSelection,
      }),
    )
  }

  const answer = async (sessionId: string, position: number) => {
    const shown = await decode(SessionQuestion)(
      await request(`/sessions/${sessionId}/questions/${position}`),
    )

    return decode(SubmitSessionAnswerResponse)(
      await request(`/sessions/${sessionId}/questions/${position}/answer`, {
        questionRevisionId: shown.questionRevisionId,
        answerId: shown.answers[0]!.id,
      }),
    )
  }

  const end = async (sessionId: string) =>
    decode(EndSessionResponse)(await request(`/sessions/${sessionId}/end`, {}))

  const studyAllDocuments = async () => {
    const { data: documents } = await decode(Schema.toCodecJson(DocumentsResponse))(
      await request('/documents?limit=100'),
    )

    const answers: Array<SubmitSessionAnswerResponse> = []

    for (const document of documents.filter(
      ({ availableQuestionCount }) => availableQuestionCount > 0,
    )) {
      const session = await start(document.id)

      for (let position = 1; position <= session.progress.total; position++) {
        answers.push(await answer(session.id, position))
      }

      await end(session.id)
    }

    return answers
  }

  return { visitor, fixture, request, start, answer, end, studyAllDocuments }
}

const smallPathLearner = async () =>
  writtenLearner({
    ...(await seededFixturePath(smallPathConfiguration)),
    config: Schema.decodeSync(CompleteOnboardingPayload)(smallPathConfiguration),
  })

const examSessionTotal = (userId: string, examSessionId: string) =>
  Effect.runPromise(
    XpReader.use(reader =>
      reader.periodTotal(Schema.decodeSync(UserId)(userId), {
        kind: 'exam_session',
        key: Schema.decodeSync(ExamSessionId)(examSessionId),
      }),
    ).pipe(
      Effect.map(Option.map(({ total }) => total)),
      Effect.provide(XpReaderLive.pipe(Layer.provide(databaseLayerFromConfig))),
      Effect.scoped,
    ),
  )

test('each completed written round earns its reward once and the first round earns its badges', async () => {
  const learner = await smallPathLearner()

  const firstRound = await learner.studyAllDocuments()
  const rewarded = firstRound.filter(({ rewards }) => rewards.roundReward !== null)

  expect(rewarded.map(({ rewards }) => rewards.roundReward)).toEqual([
    { part: 'written', xp: 1000 },
  ])
  expect(rewarded[0]!.rewards.badges.map(({ code }) => code).sort()).toEqual([
    'first_written_round',
    'xp_1000',
  ])

  const secondRound = await learner.studyAllDocuments()

  expect(
    secondRound.flatMap(({ rewards }) =>
      rewards.roundReward === null ? [] : [rewards.roundReward],
    ),
  ).toEqual([{ part: 'written', xp: 1000 }])
  expect(grantedBadgeCodes(secondRound.map(({ rewards }) => rewards))).toEqual([])

  const { total } = await learningXpOf(learner.visitor)

  expect(await badgeCodesOf(learner.visitor)).toEqual([
    'first_finished_session',
    'first_written_round',
    'xp_1000',
  ])
  expect(
    await examSessionTotal(learner.visitor.userId, smallPathConfiguration.examSessionId),
  ).toEqual(Option.some(total))
})

test('retrying the answer that completed a round reports no reward again', async () => {
  const learner = await smallPathLearner()

  const { data: documents } = await decode(Schema.toCodecJson(DocumentsResponse))(
    await learner.request('/documents?limit=100'),
  )

  const studied = documents.filter(({ availableQuestionCount }) => availableQuestionCount > 0)
  let last = { sessionId: '', position: 0 }

  for (const document of studied) {
    const session = await learner.start(document.id)

    for (let position = 1; position <= session.progress.total; position++) {
      await learner.answer(session.id, position)
      last = { sessionId: session.id, position }
    }
  }

  const retried = await learner.answer(last.sessionId, last.position)

  expect(retried.rewards).toEqual({ roundReward: null, badges: [] })
  expect(await badgeCodesOf(learner.visitor)).toEqual(['first_written_round', 'xp_1000'])
})

test('only the first session ended with an answer earns its badge, once under concurrent endings', async () => {
  const learner = await writtenLearner(await createStudyFixture(studySessionSpecialization))
  const other = await createStudyFixture(studySessionSpecialization)

  await addFixtureQuestion(learner.fixture.pathId, learner.fixture.documentId)
  await addFixtureQuestion(other.pathId, other.documentId)

  const empty = await learner.start(learner.fixture.documentId)

  expect((await learner.end(empty.id)).rewards).toEqual({ roundReward: null, badges: [] })

  const sessions = [
    await learner.start(learner.fixture.documentId),
    await learner.start(other.documentId),
  ]

  for (const session of sessions) {
    await learner.answer(session.id, 1)
  }

  const ended = await Promise.all(sessions.map(session => learner.end(session.id)))

  expect(grantedBadgeCodes(ended.map(({ rewards }) => rewards))).toEqual(['first_finished_session'])
  expect(await badgeCodesOf(learner.visitor)).toEqual(['first_finished_session'])
})

test('reaching a seven-day streak earns the streak badge with the answer that qualifies the day', async () => {
  const learner = await writtenLearner(await createStudyFixture(studySessionSpecialization))

  for (let index = 0; index < 5; index++) {
    await addFixtureQuestion(learner.fixture.pathId, learner.fixture.documentId)
  }

  for (let days = 6; days >= 1; days--) {
    await qualifyFixtureDay(
      Schema.decodeSync(UserId)(learner.visitor.userId),
      DateTime.subtract(catalogueTestTime, { days }),
    )
  }

  const session = await learner.start(learner.fixture.documentId)
  const answers = []

  for (let position = 1; position <= 5; position++) {
    answers.push(await learner.answer(session.id, position))
  }

  expect(answers.map(({ rewards }) => rewards.badges.map(({ code }) => code))).toEqual([
    [],
    [],
    [],
    [],
    ['streak_7'],
  ])
})

test('the first passed mock exam earns its badge on the finishing request only', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000011')

  await createMockExamFixture(
    await resolveFixturePath(configuration),
    [{ questionCount: 2, eligibleQuestions: 2 }],
    1,
  )

  const learner = await mockExamLearner(api, configuration)
  const finished = []

  for (let attemptNumber = 1; attemptNumber <= 2; attemptNumber++) {
    const attempt = await learner.started()

    for (const question of await learner.questions(attempt)) {
      await learner.saveAnswer(attempt.id, question.position, {
        answerId: question.answers.find(option => option.text === 'A')!.id,
        expectedVersion: question.version,
      })
    }

    finished.push(
      await decode(FinishMockExamAttemptResponse)(
        await learner.request(`/attempts/${attempt.id}/finish`, 'POST'),
      ),
    )
  }

  expect(finished.map(result => result?.attempt.result?.passed)).toEqual([true, true])
  expect(finished.map(result => result?.rewards.badges.map(({ code }) => code))).toEqual([
    ['first_passed_mock_exam'],
    [],
  ])
  expect(await badgeCodesOf(learner.visitor)).toEqual(['first_passed_mock_exam'])
})
