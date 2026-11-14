import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  LatestStudySession,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/study/responses'
import { Effect, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureQuestion,
  createStudyFixture,
  publishFixtureRevision,
  runFixture,
  sessionGoalVersion,
  studySessionSpecialization,
} from '~api/test/learning-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

// A signed-in learner on a fresh test-only document with the given number of published questions.
const learnerWithDocument = async (questionCount: number) => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const questions: Array<Awaited<ReturnType<typeof addFixtureQuestion>>> = []

  for (let index = 0; index < questionCount; index++) {
    questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  }

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  return { visitor, fixture, questions, request }
}

const decodeSession = async (response: Response) =>
  Schema.decodeUnknownSync(StudySession)(await response.json())

const decodeLatest = async (response: Response) =>
  Schema.decodeUnknownSync(LatestStudySession)(await response.json())

const decodeQuestion = async (response: Response) =>
  Schema.decodeUnknownSync(SessionQuestion)(await response.json())

type AnswerIdentity = { readonly id: string; readonly text: string; readonly isCorrect: boolean }

// The options' identity and correctness, independent of the order they are shown in.
const answerIdentities = (answers: ReadonlyArray<AnswerIdentity>) =>
  answers
    .map(({ id, text, isCorrect }) => ({ id, text, isCorrect }))
    .toSorted((a, b) => a.id.localeCompare(b.id))

test('starting a session from the preview shows its first question and restores it after reload', async () => {
  const { fixture, questions, request } = await learnerWithDocument(2)

  const started = await request('/sessions', {
    documentId: fixture.documentId,
    questionCount: 2,
    questionSelection: 'unanswered',
  })

  expect(started.status).toBe(200)

  const session = await decodeSession(started)

  expect(session).toMatchObject({
    status: 'active',
    progress: { total: 2, answered: 0, percent: 0, currentQuestion: 1 },
    endedAt: null,
  })

  const first = await decodeQuestion(await request(`/sessions/${session.id}/questions/1`))
  const pinned = questions.find(question => question.id === first.questionId)

  expect(first).toMatchObject({ sessionId: session.id, position: 1 })
  expect(first.questionRevisionId).toBe(pinned?.revisionId)
  expect(first.explanation).toBe(pinned?.explanation)
  // Shuffling changes only the order: every option keeps its revision's identity and correctness.
  expect(answerIdentities(first.answers)).toEqual(answerIdentities(pinned?.answers ?? []))
  expect(await decodeQuestion(await request(`/sessions/${session.id}/questions/1`))).toEqual(first)
  expect(await decodeSession(await request(`/sessions/${session.id}`))).toEqual(session)
  const latest = { ...session, document: { id: fixture.documentId, title: expect.any(String) } }

  expect(
    await decodeLatest(await request(`/latest-session?documentId=${fixture.documentId}`)),
  ).toEqual(latest)
  expect(await decodeLatest(await request('/latest-session'))).toEqual(latest)
})

test('concurrent starts of one document create a single unfinished session and point the rest to it', async () => {
  const { fixture, request } = await learnerWithDocument(3)

  const responses = await Promise.all(
    Array.from({ length: 5 }, () =>
      request('/sessions', {
        documentId: fixture.documentId,
        questionCount: 3,
        questionSelection: 'unanswered',
      }),
    ),
  )

  const created = responses.filter(response => response.status === 200)
  const refused = responses.filter(response => response.status === 409)

  expect(created).toHaveLength(1)
  expect(refused).toHaveLength(4)

  const session = await decodeSession(created[0]!)

  for (const response of refused) {
    expect(await response.json()).toMatchObject({
      type: 'study_session_already_started',
      sessionId: session.id,
      currentPosition: 1,
    })
  }

  expect(
    (await decodeLatest(await request(`/latest-session?documentId=${fixture.documentId}`))).id,
  ).toBe(session.id)
})

test('starting again is refused and leaves the unfinished session, its settings and answer order intact', async () => {
  const { fixture, request } = await learnerWithDocument(26)
  const body = { documentId: fixture.documentId, questionCount: 3, questionSelection: 'unanswered' }
  const session = await decodeSession(await request('/sessions', body))

  const before = await Promise.all(
    [1, 2, 3].map(async position =>
      decodeQuestion(await request(`/sessions/${session.id}/questions/${position}`)),
    ),
  )

  const again = await request('/sessions', {
    documentId: fixture.documentId,
    questionCount: 26,
    questionSelection: 'unanswered',
  })

  expect(again.status).toBe(409)
  expect(await again.json()).toMatchObject({
    type: 'study_session_already_started',
    sessionId: session.id,
    currentPosition: session.progress.currentQuestion,
  })
  expect(await decodeSession(await request(`/sessions/${session.id}`))).toEqual(session)
  expect(new Set(before.map(question => question.questionId)).size).toBe(3)

  for (const question of before) {
    expect(
      await decodeQuestion(await request(`/sessions/${session.id}/questions/${question.position}`)),
    ).toEqual(question)
  }

  expect(await (await request(`/sessions/${session.id}/questions/4`)).json()).toBeNull()
})

test('a newer publication does not change a started session', async () => {
  const { fixture, questions, request } = await learnerWithDocument(1)
  const [original] = questions

  const session = await decodeSession(
    await request('/sessions', {
      documentId: fixture.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  await publishFixtureRevision(original!.id)

  const pinned = await decodeQuestion(await request(`/sessions/${session.id}/questions/1`))

  expect(pinned.questionRevisionId).toBe(original?.revisionId)
  expect(pinned.body).toBe(original?.body)
  expect(pinned.answers.map(answer => answer.text).toSorted()).toEqual(['A', 'B', 'C'])
})

test('a new session uses the currently published revision', async () => {
  const { fixture, questions, request } = await learnerWithDocument(1)
  const revised = await publishFixtureRevision(questions[0]!.id)

  const session = await decodeSession(
    await request('/sessions', {
      documentId: fixture.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  const question = await decodeQuestion(await request(`/sessions/${session.id}/questions/1`))

  expect(question.questionRevisionId).toBe(revised.revisionId)
  expect(question.answers.map(answer => answer.id).toSorted()).toEqual(
    revised.answers.map(answer => answer.id).toSorted(),
  )
})

test('a session on a second document leaves the first one unfinished', async () => {
  const { fixture, request } = await learnerWithDocument(1)
  const second = await createStudyFixture(studySessionSpecialization)
  await addFixtureQuestion(second.pathId, second.documentId)

  const first = await decodeSession(
    await request('/sessions', {
      documentId: fixture.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  const other = await decodeSession(
    await request('/sessions', {
      documentId: second.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  const latestOf = async (documentId?: string) =>
    (
      await decodeLatest(
        await request(
          documentId === undefined ? '/latest-session' : `/latest-session?documentId=${documentId}`,
        ),
      )
    ).id

  expect(other.id).not.toBe(first.id)
  expect(await latestOf(fixture.documentId)).toBe(first.id)
  expect(await latestOf(second.documentId)).toBe(other.id)
  expect(await latestOf()).toBe(other.id)
})

test('a session keeps the goal version it started under when the goal changes', async () => {
  const { visitor, fixture, request } = await learnerWithDocument(1)
  const second = await createStudyFixture(studySessionSpecialization)
  await addFixtureQuestion(second.pathId, second.documentId)

  const before = await decodeSession(
    await request('/sessions', {
      documentId: fixture.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  const changed = await request('/goal', {
    expectedVersion: 1,
    examSessionId: fixture.config.examSessionId,
    oralExamDate: '2028-02-20T12:34:56.789Z',
  })

  expect(changed.status).toBe(200)

  const after = await decodeSession(
    await request('/sessions', {
      documentId: second.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  const goalVersionOf = (sessionId: typeof before.id) =>
    sessionGoalVersion(visitor.userId, fixture.pathId, sessionId)

  expect(await goalVersionOf(before.id)).toBe(1)
  expect(await goalVersionOf(after.id)).toBe(2)
  expect(await decodeSession(await request(`/sessions/${before.id}`))).toEqual(before)
})

test('starting refuses empty, disallowed and outdated session scopes', async () => {
  const { fixture, questions, request } = await learnerWithDocument(2)

  const start = (questionCount: number, documentId: string = fixture.documentId) =>
    request('/sessions', { documentId, questionCount, questionSelection: 'unanswered' })

  const refused = await start(1)

  expect(refused.status).toBe(409)
  expect(await refused.json()).toMatchObject({ type: 'stale_session_preview' })
  expect((await start(3)).status).toBe(409)
  expect((await start(0)).status).toBe(409)
  expect((await start(1, '20000000-0000-4000-8000-000000000099')).status).toBe(404)

  await runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      yield* learningContentRepository.withdrawRevision(questions[0]!.revisionId)
    }),
  )

  expect((await start(2)).status).toBe(409)
  expect(
    await (await request(`/latest-session?documentId=${fixture.documentId}`)).json(),
  ).toBeNull()

  const empty = await createStudyFixture(studySessionSpecialization)

  expect((await start(0, empty.documentId)).status).toBe(409)
})

test('sessions are private to their owner and require written access', async () => {
  const { fixture, request } = await learnerWithDocument(1)

  const session = await decodeSession(
    await request('/sessions', {
      documentId: fixture.documentId,
      questionCount: 1,
      questionSelection: 'unanswered',
    }),
  )

  const other = await loginForPreparation(api)
  await learningRequest(
    api,
    other,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const otherRequest = (path: string) =>
    learningRequest(api, other, `/paths/${fixture.pathId}${path}`)

  expect(await (await otherRequest(`/sessions/${session.id}`)).json()).toBeNull()
  expect(await (await otherRequest(`/sessions/${session.id}/questions/1`)).json()).toBeNull()
  expect(await (await otherRequest('/latest-session')).json()).toBeNull()

  const oralOnly = await loginForPreparation(api)
  await learningRequest(
    api,
    oralOnly,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)({ ...fixture.config, accessScope: 'oral' }),
  )

  expect(
    (
      await learningRequest(api, oralOnly, `/paths/${fixture.pathId}/sessions`, {
        documentId: fixture.documentId,
        questionCount: 1,
        questionSelection: 'unanswered',
      })
    ).status,
  ).toBe(403)

  const guest = api.visitor()

  for (const path of [
    `/sessions/${session.id}`,
    `/sessions/${session.id}/questions/1`,
    '/latest-session',
  ]) {
    expect((await learningRequest(api, guest, `/paths/${fixture.pathId}${path}`)).status).toBe(401)
  }

  await request('/archive', {})

  expect((await request(`/sessions/${session.id}`)).status).toBe(403)
  expect(
    (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount: 1,
        questionSelection: 'unanswered',
      })
    ).status,
  ).toBe(403)
})
