import { LearningXpResponse } from '@inzpro/api-contracts/modules/learning-xp/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionPreview,
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { DateTime, Effect, Layer, Option, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { XpReader } from '~api/modules/learning-xp/application/learning-xp.reader.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion, attachFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi
let nextDay: TestApi

beforeAll(async () => {
  api = await startTestApi({ now: DateTime.makeUnsafe('2026-11-13T22:59:30Z') })
  nextDay = await startTestApi({ now: DateTime.makeUnsafe('2026-11-13T23:00:30Z') })
})

afterAll(() => Promise.all([api.close(), nextDay.close()]))

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const learner = async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  await addFixtureQuestion(fixture.pathId, fixture.documentId)
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body, on = api) =>
    learningRequest(on, visitor, `/paths/${fixture.pathId}${path}`, body)

  const start = async (on = api) => {
    const preview = await decode(SessionPreview)(
      await request(`/preview?documentId=${fixture.documentId}`, undefined, on),
    )

    return decode(StudySession)(
      await request(
        '/sessions',
        {
          documentId: fixture.documentId,
          questionCount: 1,
          questionSelection: preview.questionSelection,
        },
        on,
      ),
    )
  }

  const shown = async (session: StudySession, on = api) =>
    decode(SessionQuestion)(await request(`/sessions/${session.id}/questions/1`, undefined, on))

  const answer = async (session: StudySession, isCorrect = true, on = api) => {
    const question = await shown(session, on)

    return decode(SubmitSessionAnswerResponse)(
      await request(
        `/sessions/${session.id}/questions/1/answer`,
        {
          questionRevisionId: question.questionRevisionId,
          answerId: question.answers.find(option => option.isCorrect === isCorrect)!.id,
        },
        on,
      ),
    )
  }

  const total = () =>
    visitor.jar.fetch(new URL('/api/v1/learning-xp', api.baseUrl)).then(decode(LearningXpResponse))

  return { visitor, fixture, request, start, shown, answer, total }
}

test.each([
  { correct: true, assistance: 'none', expected: 3 },
  { correct: false, assistance: 'none', expected: 1 },
  { correct: true, assistance: 'note', expected: 2 },
  { correct: false, assistance: 'note', expected: 1 },
  { correct: true, assistance: 'explanation', expected: 1 },
  { correct: false, assistance: 'explanation', expected: 1 },
])(
  'a $assistance answer with correctness $correct awards $expected XP',
  async ({ correct, assistance, expected }) => {
    const user = await learner()
    expect(await user.total()).toMatchObject({ total: 0 })
    const session = await user.start()
    const question = await user.shown(session)

    if (assistance === 'note') {
      const saved = await user.visitor.jar.fetch(
        new URL(
          `/api/v1/study/paths/${user.fixture.pathId}/notes/${question.questionId}`,
          api.baseUrl,
        ),
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: 'Moja notatka' }),
        },
      )

      expect(saved.status).toBe(200)
    }

    if (assistance !== 'none') {
      expect(
        (await user.request(`/sessions/${session.id}/questions/1/assistance`, { kind: assistance }))
          .status,
      ).toBe(200)
    }

    expect((await user.answer(session, correct)).awardedXp).toBe(expected)
    expect(await user.total()).toMatchObject({ total: expected })
  },
)

test('retries and later modes earn zero until the next Warsaw day, beside the first session badge', async () => {
  const user = await learner()
  const session = await user.start()
  expect((await user.answer(session)).awardedXp).toBe(3)
  expect((await user.answer(session)).awardedXp).toBe(0)
  await user.request(`/sessions/${session.id}/end`, {})
  const question = await user.shown(session)
  expect(
    (
      await user.visitor.jar.fetch(
        new URL(
          `/api/v1/study/paths/${user.fixture.pathId}/favorites/${question.questionId}`,
          api.baseUrl,
        ),
        { method: 'PUT' },
      )
    ).status,
  ).toBe(200)

  const favorites = await decode(StudySession)(
    await user.request('/favorites-sessions', { questionCount: 1 }),
  )

  expect((await user.answer(favorites)).awardedXp).toBe(0)
  await user.request(`/sessions/${favorites.id}/end`, {})
  const tomorrow = await user.start(nextDay)
  expect((await user.answer(tomorrow, true, nextDay)).awardedXp).toBe(3)
  expect(await user.total()).toMatchObject({ total: 106 })
})

test('concurrent answers on different paths share the daily question limit', async () => {
  const user = await learner()
  const firstSession = await user.start()
  const question = await user.shown(firstSession)
  const otherPath = await createStudyFixture('60000000-0000-4000-8000-000000000006')
  await attachFixtureQuestion(otherPath.pathId, user.fixture.documentId, question.questionId)
  await learningRequest(
    api,
    user.visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(otherPath.config),
  )

  const secondSession = await decode(StudySession)(
    await learningRequest(api, user.visitor, `/paths/${otherPath.pathId}/sessions`, {
      documentId: user.fixture.documentId,
      questionCount: 1,
      questionSelection: 'uncovered',
    }),
  )

  const otherQuestion = await decode(SessionQuestion)(
    await learningRequest(
      api,
      user.visitor,
      `/paths/${otherPath.pathId}/sessions/${secondSession.id}/questions/1`,
    ),
  )

  const results = await Promise.all([
    user.answer(firstSession),
    learningRequest(
      api,
      user.visitor,
      `/paths/${otherPath.pathId}/sessions/${secondSession.id}/questions/1/answer`,
      {
        questionRevisionId: otherQuestion.questionRevisionId,
        answerId: otherQuestion.answers.find(option => option.isCorrect)!.id,
      },
    ).then(decode(SubmitSessionAnswerResponse)),
  ])

  expect(results.map(result => result.awardedXp).sort((left, right) => left - right)).toEqual([
    0, 3,
  ])
  expect(await user.total()).toMatchObject({ total: 3 })
})

test('a due review adds one XP and every period receives exactly the awarded amount with the first session badge', async () => {
  const user = await learner()
  const session = await user.start()
  expect((await user.answer(session, false)).awardedXp).toBe(1)
  await user.request(`/sessions/${session.id}/end`, {})

  const review = await decode(StudySession)(
    await user.request('/review-sessions', { questionCount: 1 }, nextDay),
  )

  expect((await user.answer(review, true, nextDay)).awardedXp).toBe(4)
  expect(await user.total()).toMatchObject({ total: 105 })

  for (const period of [
    { kind: 'week', key: '2026-11-09' },
    { kind: 'month', key: '2026-11-01' },
    { kind: 'exam_session', key: user.fixture.config.examSessionId },
    { kind: 'all_time', key: 'all' },
  ] as const) {
    const total = await Effect.runPromise(
      XpReader.use(reader => reader.periodTotal(user.visitor.userId, period)).pipe(
        Effect.provide(XpReaderLive.pipe(Layer.provide(databaseLayerFromConfig))),
        Effect.scoped,
      ),
    )

    expect(Option.map(total, value => value.total)).toEqual(Option.some(105))
  }
})

test('a guest cannot read account XP', async () => {
  expect((await api.visitor().jar.fetch(new URL('/api/v1/learning-xp', api.baseUrl))).status).toBe(
    401,
  )
})
