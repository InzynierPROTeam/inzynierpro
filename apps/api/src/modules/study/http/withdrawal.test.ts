import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  SessionResultsResponse,
  StudySession,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/study/responses'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureQuestion,
  createStudyFixture,
  publishFixtureRevision,
  studySessionSpecialization,
  withdrawFixtureRevision,
} from '~api/test/learning-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

// A signed-in learner with a started session over every question of a fresh document.
const learnerInSession = async (questionCount: number) => {
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

  const started = Schema.decodeUnknownSync(StudySession)(
    await (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount,
        questionSelection: 'uncovered',
      })
    ).json(),
  )

  const sessionPath = `/sessions/${started.id}`

  const question = async (position: number) =>
    Schema.decodeUnknownSync(SessionQuestion)(
      await (await request(`${sessionPath}/questions/${position}`)).json(),
    )

  const optionOf = (shown: SessionQuestion, correct: boolean) =>
    shown.answers.find(({ isCorrect }) => isCorrect === correct)!

  // Submits an option of the question as the client last showed it.
  const submit = (shown: SessionQuestion, correct = true) =>
    request(`${sessionPath}/questions/${shown.position}/answer`, {
      questionRevisionId: shown.questionRevisionId,
      answerId: optionOf(shown, correct).id,
    })

  const answer = async (position: number, correct = true) => {
    const response = await submit(await question(position), correct)

    expect(response.status).toBe(200)
  }

  const session = async () =>
    Schema.decodeUnknownSync(StudySession)(await (await request(sessionPath)).json())

  const end = async () => {
    const response = await request(`${sessionPath}/end`, {})

    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(StudySession)(await response.json())
  }

  const summary = async () =>
    Schema.decodeUnknownSync(StudySessionSummary)(
      await (await request(`${sessionPath}/summary`)).json(),
    )

  const results = async () =>
    Schema.decodeUnknownSync(Schema.toCodecJson(SessionResultsResponse))(
      await (await request(`${sessionPath}/results`)).json(),
    )

  return { fixture, questions, request, question, submit, answer, session, end, summary, results }
}

test('a withdrawn question is skipped without penalty in progress and the summary score', async () => {
  const { questions, answer, session, end, summary, results } = await learnerInSession(3)

  await withdrawFixtureRevision(questions[1]!.revisionId)
  await answer(1)

  // The continue point passes over the withdrawn question.
  expect((await session()).progress).toEqual({
    total: 3,
    answered: 1,
    skipped: 1,
    percent: 50,
    currentQuestion: 3,
  })

  await answer(3)

  expect((await session()).progress).toMatchObject({ answered: 2, skipped: 1, percent: 100 })

  await end()

  expect((await summary()).result).toEqual({
    correct: 2,
    incorrect: 0,
    assisted: 0,
    correctPercent: 100,
  })
  expect((await results()).data).toEqual([
    { position: 1, answer: { isCorrect: true, isAssisted: false }, isWithdrawn: false },
    { position: 2, answer: null, isWithdrawn: true },
    { position: 3, answer: { isCorrect: true, isAssisted: false }, isWithdrawn: false },
  ])
})

test('when every remaining question is withdrawn nothing is left to answer and the session ends with its summary', async () => {
  const { questions, question, submit, answer, session, end, summary } = await learnerInSession(3)

  await answer(1, false)

  const opened = await question(2)

  await withdrawFixtureRevision(questions[1]!.revisionId)
  await withdrawFixtureRevision(questions[2]!.revisionId)

  // The client still shows the question it opened before the withdrawal; the backend refuses it.
  const refused = await submit(opened)

  expect(refused.status).toBe(409)
  expect(await refused.json()).toMatchObject({ type: 'session_question_withdrawn' })
  expect((await session()).progress).toMatchObject({
    total: 3,
    answered: 1,
    skipped: 2,
    percent: 100,
  })

  expect(await end()).toMatchObject({ status: 'ended', progress: { answered: 1, skipped: 2 } })
  expect((await summary()).result).toEqual({
    correct: 0,
    incorrect: 1,
    assisted: 0,
    correctPercent: 0,
  })
})

test('an answer stored before its revision was withdrawn stays reproducible and scored', async () => {
  const { questions, question, submit, answer, session, end, summary, results } =
    await learnerInSession(2)

  await answer(1, false)

  const answered = await question(1)

  await withdrawFixtureRevision(questions[0]!.revisionId)

  const shown = await question(1)

  // The pinned revision, its options and the stored answer read back unchanged.
  expect(shown).toEqual({ ...answered, isWithdrawn: true })

  // Retrying the stored answer after a lost response still returns it rather than a refusal.
  expect((await submit(answered, false)).status).toBe(200)
  expect((await session()).progress).toMatchObject({ answered: 1, skipped: 0 })

  await end()

  expect((await summary()).result).toMatchObject({ correct: 0, incorrect: 1, correctPercent: 0 })
  expect((await results()).data[0]).toEqual({
    position: 1,
    answer: { isCorrect: false, isAssisted: false },
    isWithdrawn: true,
  })
})

test('a withdrawal racing a submission either keeps the answer or skips the question, never both', async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { questions, question, submit, session } = await learnerInSession(1)
    const opened = await question(1)

    const [response] = await Promise.all([
      submit(opened),
      withdrawFixtureRevision(questions[0]!.revisionId),
    ])

    const shown = await question(1)
    const { progress } = await session()

    expect(shown.isWithdrawn).toBe(true)

    if (response.status === 200) {
      expect(shown.answer).not.toBeNull()
      expect(progress).toMatchObject({ answered: 1, skipped: 0 })
    } else {
      expect(response.status).toBe(409)
      expect(shown.answer).toBeNull()
      expect(progress).toMatchObject({ answered: 0, skipped: 1 })
    }
  }
})

test('a newer publication leaves the started session on its pinned revision, unlike a withdrawal', async () => {
  const { questions, question, submit, session } = await learnerInSession(2)
  const pinned = await question(1)

  const revision = await publishFixtureRevision(questions[0]!.id)

  // Publishing and even withdrawing the newer revision never reaches the pinned one.
  await withdrawFixtureRevision(revision.revisionId)

  expect(await question(1)).toEqual(pinned)
  expect((await submit(pinned)).status).toBe(200)

  const second = await question(2)

  await withdrawFixtureRevision(questions[1]!.revisionId)

  expect((await submit(second)).status).toBe(409)
  expect((await session()).progress).toMatchObject({ answered: 1, skipped: 1 })
})

test('a withdrawal after the session ended leaves its summary unchanged', async () => {
  const { questions, answer, end, summary } = await learnerInSession(2)

  await answer(1)
  await end()

  const before = await summary()

  await withdrawFixtureRevision(questions[1]!.revisionId)

  expect(await summary()).toEqual(before)
  expect(before.progress).toMatchObject({ answered: 1, skipped: 0 })
  expect(before.result.correctPercent).toBe(50)
})
