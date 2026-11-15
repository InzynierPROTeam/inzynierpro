import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/study/responses'
import type { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureQuestion,
  createStudyFixture,
  studySessionSpecialization,
  withdrawFixtureRevision,
} from '~api/test/learning-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

// A signed-in learner with a started session over a fresh document of the given size.
const learnerInSession = async (questionCount: number, accessScope: ExamAccessScope = 'both') => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)

  for (let index = 0; index < questionCount; index++) {
    await addFixtureQuestion(fixture.pathId, fixture.documentId)
  }

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)({ ...fixture.config, accessScope }),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const session = Schema.decodeUnknownSync(StudySession)(
    await (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount,
        questionSelection: 'unanswered',
      })
    ).json(),
  )

  const sessionPath = `/sessions/${session.id}`

  const question = async (position: number) =>
    Schema.decodeUnknownSync(SessionQuestion)(
      await (await request(`${sessionPath}/questions/${position}`)).json(),
    )

  const progress = async () =>
    Schema.decodeUnknownSync(StudySession)(await (await request(sessionPath)).json()).progress

  const submit = (position: number, body: { questionRevisionId: string; answerId: string }) =>
    request(`${sessionPath}/questions/${position}/answer`, body)

  const openExplanation = (position: number) =>
    request(`${sessionPath}/questions/${position}/assistance`, {})

  return { visitor, fixture, session, request, question, progress, submit, openExplanation }
}

const decodeResult = async (response: Response) =>
  Schema.decodeUnknownSync(SubmitSessionAnswerResponse)(await response.json())

const correctOf = (question: SessionQuestion) => question.answers.find(answer => answer.isCorrect)!

const wrongOf = (question: SessionQuestion) => question.answers.find(answer => !answer.isCorrect)!

test('a correct answer is scored, moves the session on and is restored after reload', async () => {
  const { question, progress, submit } = await learnerInSession(2)
  const first = await question(1)

  expect(first.answer).toBeNull()

  const response = await submit(1, {
    questionRevisionId: first.questionRevisionId,
    answerId: correctOf(first).id,
  })

  expect(response.status).toBe(200)

  const result = await decodeResult(response)

  expect(result.question.answer).toMatchObject({
    answerId: correctOf(first).id,
    isCorrect: true,
    isAssisted: false,
  })
  expect(result.session.progress).toEqual({
    total: 2,
    answered: 1,
    skipped: 0,
    percent: 50,
    currentQuestion: 2,
  })
  expect(await question(1)).toEqual(result.question)
  expect(await progress()).toEqual(result.session.progress)
})

test('a wrong answer is stored as wrong and still covers the question in its category', async () => {
  const { fixture, request, question, submit } = await learnerInSession(1)
  const first = await question(1)

  const result = await decodeResult(
    await submit(1, { questionRevisionId: first.questionRevisionId, answerId: wrongOf(first).id }),
  )

  expect(result.question.answer).toMatchObject({
    answerId: wrongOf(first).id,
    isCorrect: false,
    isAssisted: false,
  })
  // A single-question session has nowhere further to go, so it stays on the answered question.
  expect(result.session.progress).toMatchObject({ answered: 1, percent: 100, currentQuestion: 1 })
  expect(await (await request(`/documents/${fixture.documentId}`)).json()).toMatchObject({
    document: { availableQuestionCount: 1, completedQuestionCount: 1 },
  })
})

test('opening the explanation before answering marks the answer assisted, once', async () => {
  const { question, submit, openExplanation } = await learnerInSession(2)
  const first = await question(1)

  const opened = await openExplanation(1)

  expect(opened.status).toBe(200)

  const assisted = Schema.decodeUnknownSync(SessionQuestion)(await opened.json())

  expect(assisted.explanationOpenedAt).not.toBeNull()
  expect(assisted.answer).toBeNull()
  // Opening it again keeps the first recorded opening.
  expect(
    Schema.decodeUnknownSync(SessionQuestion)(await (await openExplanation(1)).json()),
  ).toEqual(assisted)

  const result = await decodeResult(
    await submit(1, {
      questionRevisionId: first.questionRevisionId,
      answerId: correctOf(first).id,
    }),
  )

  expect(result.question.answer).toMatchObject({ isCorrect: true, isAssisted: true })

  // Opening the explanation after answering is feedback and does not change the stored answer.
  const second = await question(2)

  const independent = await decodeResult(
    await submit(2, {
      questionRevisionId: second.questionRevisionId,
      answerId: correctOf(second).id,
    }),
  )

  expect(independent.question.answer?.isAssisted).toBe(false)

  const afterwards = Schema.decodeUnknownSync(SessionQuestion)(
    await (await openExplanation(2)).json(),
  )

  expect(afterwards.answer).toEqual(independent.question.answer)
  expect(afterwards.explanationOpenedAt).toBeNull()
})

test('retrying an answer after a lost response returns the stored result without a second attempt', async () => {
  const { question, progress, submit } = await learnerInSession(2)
  const first = await question(1)
  const body = { questionRevisionId: first.questionRevisionId, answerId: wrongOf(first).id }

  const original = await decodeResult(await submit(1, body))
  const retried = await submit(1, body)

  expect(retried.status).toBe(200)
  expect(await decodeResult(retried)).toEqual(original)
  expect((await progress()).answered).toBe(1)
})

test('a different second answer is refused and never overwrites the first', async () => {
  const { question, progress, submit, openExplanation } = await learnerInSession(2)
  const first = await question(1)

  const stored = await decodeResult(
    await submit(1, { questionRevisionId: first.questionRevisionId, answerId: wrongOf(first).id }),
  )

  const second = await submit(1, {
    questionRevisionId: first.questionRevisionId,
    answerId: correctOf(first).id,
  })

  expect(second.status).toBe(409)
  expect(await second.json()).toMatchObject({ type: 'session_answer_already_submitted' })

  // Opening the explanation afterwards cannot turn the stored answer into an assisted one.
  await openExplanation(1)

  expect((await question(1)).answer).toEqual(stored.question.answer)
  expect((await progress()).answered).toBe(1)
})

test('concurrent answers to one question store only the first and refuse the other', async () => {
  const { question, progress, submit } = await learnerInSession(2)
  const first = await question(1)

  const responses = await Promise.all(
    [correctOf(first), wrongOf(first)].map(answer =>
      submit(1, { questionRevisionId: first.questionRevisionId, answerId: answer.id }),
    ),
  )

  const accepted = responses.filter(response => response.status === 200)
  const refused = responses.filter(response => response.status === 409)

  expect(accepted).toHaveLength(1)
  expect(refused).toHaveLength(1)

  const winner = await decodeResult(accepted[0]!)

  expect((await question(1)).answer).toEqual(winner.question.answer)
  expect((await progress()).answered).toBe(1)
})

test('concurrent retries of the same answer all return the one stored result', async () => {
  const { question, progress, submit } = await learnerInSession(1)
  const first = await question(1)
  const body = { questionRevisionId: first.questionRevisionId, answerId: correctOf(first).id }

  const results = await Promise.all(
    Array.from({ length: 4 }, async () => decodeResult(await submit(1, body))),
  )

  expect(new Set(results.map(result => result.question.answer?.answeredAt)).size).toBe(1)
  expect((await progress()).answered).toBe(1)
})

test('an option of another question or another revision is refused', async () => {
  const { question, progress, submit } = await learnerInSession(2)
  const first = await question(1)
  const second = await question(2)

  const foreignOption = await submit(1, {
    questionRevisionId: first.questionRevisionId,
    answerId: correctOf(second).id,
  })

  expect(foreignOption.status).toBe(422)
  expect(await foreignOption.json()).toMatchObject({ type: 'invalid_session_answer' })

  const foreignRevision = await submit(1, {
    questionRevisionId: second.questionRevisionId,
    answerId: correctOf(first).id,
  })

  expect(foreignRevision.status).toBe(422)
  expect((await question(1)).answer).toBeNull()
  expect((await progress()).answered).toBe(0)
})

test('a withdrawn question is shown as withdrawn and accepts neither an answer nor a hint record', async () => {
  const { question, submit, openExplanation } = await learnerInSession(1)
  const first = await question(1)

  expect(first.isWithdrawn).toBe(false)

  await withdrawFixtureRevision(first.questionRevisionId)

  const refused = await submit(1, {
    questionRevisionId: first.questionRevisionId,
    answerId: correctOf(first).id,
  })

  expect(refused.status).toBe(409)
  expect(await refused.json()).toMatchObject({ type: 'session_question_withdrawn' })

  const opened = await openExplanation(1)

  expect(opened.status).toBe(200)
  expect(await question(1)).toMatchObject({
    isWithdrawn: true,
    answer: null,
    explanationOpenedAt: null,
  })
})

test("another learner's session, a missing question and a guest cannot answer or open help", async () => {
  const { fixture, session, question, submit } = await learnerInSession(1)
  const first = await question(1)
  const body = { questionRevisionId: first.questionRevisionId, answerId: correctOf(first).id }

  const other = await loginForPreparation(api)
  await learningRequest(
    api,
    other,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const sessionPath = `/paths/${fixture.pathId}/sessions/${session.id}/questions`

  for (const path of [`${sessionPath}/1/answer`, `${sessionPath}/1/assistance`]) {
    const response = await learningRequest(api, other, path, body)

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ type: 'session_question_not_found' })
  }

  expect((await submit(2, body)).status).toBe(404)
  expect((await learningRequest(api, api.visitor(), `${sessionPath}/1/answer`, body)).status).toBe(
    401,
  )
  expect((await question(1)).answer).toBeNull()
  expect((await question(1)).explanationOpenedAt).toBeNull()
})

test('extending access, changing the goal, archiving and restoring keep the stored answer and coverage', async () => {
  const { fixture, request, question, progress, submit } = await learnerInSession(2, 'written')
  const first = await question(1)
  const body = { questionRevisionId: first.questionRevisionId, answerId: correctOf(first).id }
  const stored = await decodeResult(await submit(1, body))

  const completed = async () => (await request(`/documents/${fixture.documentId}`)).json()

  // Extending access appends goal version 2; the goal change then appends version 3.
  expect((await request('/extend', {})).status).toBe(200)
  expect(
    (
      await request('/goal', {
        expectedVersion: 2,
        examSessionId: fixture.config.examSessionId,
        oralExamDate: '2028-02-20T12:34:56.789Z',
      })
    ).status,
  ).toBe(200)
  expect((await request('/archive', {})).status).toBe(200)
  expect((await request('/restore', {})).status).toBe(200)

  expect((await question(1)).answer).toEqual(stored.question.answer)
  expect(await progress()).toEqual(stored.session.progress)
  expect(await completed()).toMatchObject({ document: { completedQuestionCount: 1 } })
  // Sending the answer again still returns the one stored result instead of a second attempt.
  expect(await decodeResult(await submit(1, body))).toEqual(stored)
  expect((await progress()).answered).toBe(1)
})
