import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  LatestStudySession,
  SessionPreview,
  SessionQuestion,
  SessionResultsResponse,
  StudySession,
  StudySessionSummary,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { Effect, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { runFixture } from '~api/test/run-fixture.js'
import { addFixtureQuestion, withdrawFixtureRevision } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

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

  const preview = async () =>
    Schema.decodeUnknownSync(SessionPreview)(
      await (await request(`/preview?documentId=${fixture.documentId}`)).json(),
    )

  const start = async () => {
    const offered = await preview()

    const response = await request('/sessions', {
      documentId: fixture.documentId,
      questionCount: offered.settings.defaultQuestionCount,
      questionSelection: offered.questionSelection,
    })

    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(StudySession)(await response.json())
  }

  const question = async (sessionId: string, position: number) =>
    Schema.decodeUnknownSync(SessionQuestion)(
      await (await request(`/sessions/${sessionId}/questions/${position}`)).json(),
    )

  const answer = async (sessionId: string, position: number, correct = true) => {
    const shown = await question(sessionId, position)
    const option = shown.answers.find(({ isCorrect }) => isCorrect === correct)!

    const response = await request(`/sessions/${sessionId}/questions/${position}/answer`, {
      questionRevisionId: shown.questionRevisionId,
      answerId: option.id,
    })

    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(SubmitSessionAnswerResponse)(await response.json())
  }

  const session = async (sessionId: string) =>
    Schema.decodeUnknownSync(StudySession)(await (await request(`/sessions/${sessionId}`)).json())

  const summary = async (sessionId: string) =>
    Schema.decodeUnknownSync(StudySessionSummary)(
      await (await request(`/sessions/${sessionId}/summary`)).json(),
    )

  const results = async (sessionId: string, query = '') =>
    Schema.decodeUnknownSync(Schema.toCodecJson(SessionResultsResponse))(
      await (await request(`/sessions/${sessionId}/results${query}`)).json(),
    )

  const latest = async (query = '') =>
    Schema.decodeUnknownSync(LatestStudySession)(
      await (await request(`/latest-session${query}`)).json(),
    )

  return {
    visitor,
    fixture,
    questions,
    request,
    preview,
    start,
    question,
    answer,
    session,
    summary,
    results,
    latest,
  }
}

test('answering moves to the next unanswered question and the session stays open until it is ended', async () => {
  const { start, answer, session, request } = await learnerWithDocument(3)
  const started = await start()

  expect((await answer(started.id, 2)).session).toMatchObject({
    status: 'active',
    progress: { answered: 1, currentQuestion: 3 },
  })
  expect((await answer(started.id, 3)).session).toMatchObject({
    status: 'active',
    progress: { answered: 2, currentQuestion: 1 },
  })

  const last = await answer(started.id, 1, false)

  expect(last.session).toMatchObject({
    status: 'active',
    progress: { total: 3, answered: 3, percent: 100, currentQuestion: 1 },
    endedAt: null,
  })

  const ended = await request(`/sessions/${started.id}/end`, {})

  expect(ended.status).toBe(200)

  const endedSession = Schema.decodeUnknownSync(StudySession)(await ended.json())

  expect(endedSession).toMatchObject({ status: 'ended', progress: { answered: 3 } })
  expect(endedSession.endedAt).not.toBeNull()
  expect(await session(started.id)).toEqual(endedSession)
})

test('the continue point skips a withdrawn question', async () => {
  const { start, answer, question } = await learnerWithDocument(3)
  const started = await start()
  const second = await question(started.id, 2)

  await withdrawFixtureRevision(second.questionRevisionId)

  expect((await answer(started.id, 1)).session.progress).toMatchObject({
    answered: 1,
    currentQuestion: 3,
  })
})

test('only an ended session has a summary with its result and every question, page by page', async () => {
  const { start, answer, summary, results, fixture, request } = await learnerWithDocument(3)
  const started = await start()

  await answer(started.id, 1)
  await answer(started.id, 2, false)

  expect(await (await request(`/sessions/${started.id}/summary`)).json()).toBeNull()
  expect((await results(started.id)).data).toEqual([])

  await request(`/sessions/${started.id}/end`, {})

  expect(await summary(started.id)).toMatchObject({
    id: started.id,
    status: 'ended',
    document: { id: fixture.documentId },
    result: { correct: 1, incorrect: 1, assisted: 0, correctPercent: 33 },
  })

  const first = await results(started.id, '?limit=2')

  expect(first.data).toEqual([
    { position: 1, answer: { isCorrect: true, isAssisted: false }, isWithdrawn: false },
    { position: 2, answer: { isCorrect: false, isAssisted: false }, isWithdrawn: false },
  ])
  expect(first.meta.hasMore).toBe(true)

  const rest = await results(started.id, `?limit=2&cursor=${first.meta.nextCursor}`)

  expect(rest.data).toEqual([{ position: 3, answer: null, isWithdrawn: false }])
  expect(rest.meta.hasMore).toBe(false)
})

test('an assisted answer counts in the summary result', async () => {
  const { start, answer, summary, request } = await learnerWithDocument(1)
  const started = await start()

  await request(`/sessions/${started.id}/questions/1/assistance`, { kind: 'explanation' })
  await answer(started.id, 1)
  await request(`/sessions/${started.id}/end`, {})

  expect((await summary(started.id)).result).toEqual({
    correct: 1,
    incorrect: 0,
    assisted: 1,
    correctPercent: 100,
  })
})

test('ending a session keeps its answers, refuses new ones and lets a new session answer again', async () => {
  const { start, answer, question, session, summary, preview, request } =
    await learnerWithDocument(3)

  const first = await start()

  await answer(first.id, 1)

  const ended = await request(`/sessions/${first.id}/end`, {})

  expect(ended.status).toBe(200)
  expect(Schema.decodeUnknownSync(StudySession)(await ended.json())).toMatchObject({
    id: first.id,
    status: 'ended',
    progress: { answered: 1 },
  })
  expect((await request(`/sessions/${first.id}/end`, {})).status).toBe(200)
  expect((await summary(first.id)).result).toMatchObject({ correct: 1 })
  const open = await question(first.id, 2)

  const refused = await request(`/sessions/${first.id}/questions/2/answer`, {
    questionRevisionId: open.questionRevisionId,
    answerId: open.answers[0]!.id,
  })

  expect(refused.status).toBe(409)
  expect(await refused.json()).toMatchObject({ type: 'study_session_ended' })

  expect(await preview()).toMatchObject({
    questionSelection: 'uncovered',
    availableQuestionCount: 2,
  })

  const second = await start()

  expect((await session(second.id)).progress.total).toBe(2)
})

test('the next session draws uncovered questions, then deliberately goes over a document covered in the round', async () => {
  const { fixture, start, answer, question, preview, request } = await learnerWithDocument(3)
  const first = await start()

  expect(first.progress.total).toBe(3)
  await answer(first.id, 1)
  await request(`/sessions/${first.id}/end`, {})

  const answered = (await question(first.id, 1)).questionId
  const second = await start()

  const drawn = [
    (await question(second.id, 1)).questionId,
    (await question(second.id, 2)).questionId,
  ]

  expect(drawn).not.toContain(answered)
  await answer(second.id, 1)
  await answer(second.id, 2)
  await request(`/sessions/${second.id}/end`, {})

  expect(await preview()).toMatchObject({
    questionSelection: 'covered',
    availableQuestionCount: 3,
    settings: { defaultQuestionCount: 3 },
  })
  expect(
    (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount: 3,
        questionSelection: 'uncovered',
      })
    ).status,
  ).toBe(409)

  const again = await start()

  expect(again.progress.total).toBe(3)
  expect((await answer(again.id, 1)).question.answer).not.toBeNull()
})

test('continuing points to the most recently used session of the path and each document keeps its own', async () => {
  const { visitor, fixture, start, answer, latest, request } = await learnerWithDocument(2)
  const firstSession = await start()

  const otherDocument = await runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const id = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      yield* learningContentRepository.createDocument({ id, title: 'Test-only second document' })
      yield* learningContentRepository.attachDocument(fixture.pathId, id)

      return id
    }),
  )

  await addFixtureQuestion(fixture.pathId, otherDocument)

  const otherSession = Schema.decodeUnknownSync(StudySession)(
    await (
      await learningRequest(api, visitor, `/paths/${fixture.pathId}/sessions`, {
        documentId: otherDocument,
        questionCount: 1,
        questionSelection: 'uncovered',
      })
    ).json(),
  )

  expect((await latest()).id).toBe(otherSession.id)

  await answer(firstSession.id, 1)

  expect((await latest()).id).toBe(firstSession.id)
  expect((await latest(`?documentId=${otherDocument}`)).id).toBe(otherSession.id)
  expect((await latest(`?documentId=${fixture.documentId}`)).id).toBe(firstSession.id)
  expect((await request(`/sessions/${otherSession.id}`)).status).toBe(200)
})

test("another learner's session has no summary or results and cannot be ended", async () => {
  const { start } = await learnerWithDocument(1)
  const owned = await start()
  const other = await learnerWithDocument(1)

  expect(await (await other.request(`/sessions/${owned.id}/summary`)).json()).toBeNull()
  expect((await other.request(`/sessions/${owned.id}/results`)).status).toBe(200)
  expect((await other.results(owned.id)).data).toEqual([])
  expect((await other.request(`/sessions/${owned.id}/end`, {})).status).toBe(404)
})
