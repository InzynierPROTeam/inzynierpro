import {
  AttemptReviewResponse,
  MockExamHistoryResponse,
  MockExamAttempt,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { decodeResponse, mockExamLearner } from '~api/test/mock-exam-learner.js'
import { withdrawFixtureRevision } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

it('finishes at the pass threshold, counts unanswered as wrong and preserves the result on retry', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const pathId = await resolveFixturePath(configuration)
  await createMockExamFixture(
    pathId,
    [
      { questionCount: 2, eligibleQuestions: 2 },
      { questionCount: 2, eligibleQuestions: 2 },
    ],
    2,
  )
  const learner = await mockExamLearner(api, configuration)
  const attempt = await learner.started()
  const questions = await learner.questions(attempt)

  for (const question of questions.filter(question => question.section === 1)) {
    const answer = question.answers.find(option => option.text === 'A')

    if (answer === undefined) {
      throw new Error('Missing correct fixture answer')
    }

    await learner.saveAnswer(attempt.id, question.position, {
      answerId: answer.id,
      expectedVersion: question.version,
    })
  }

  const response = await learner.request(`/attempts/${attempt.id}/finish`, 'POST')
  expect(response.status).toBe(200)
  const finished = await decodeResponse(MockExamAttempt)(response)
  expect(finished).toMatchObject({
    status: 'finished',
    result: {
      correct: 2,
      incorrect: 2,
      unanswered: 2,
      percent: 50,
      passed: true,
      pauseCount: 0,
      pauseSeconds: 0,
    },
  })
  expect(finished.result?.sections).toMatchObject([{ correct: 2 }, { correct: 0 }])
  expect(
    await (await learner.request(`/attempts/${attempt.id}/finish`, 'POST')).json(),
  ).toStrictEqual(finished)
  const question = questions[0]

  if (question === undefined || question.answers[0] === undefined) {
    throw new Error('Missing question')
  }

  expect(
    (
      await learner.saveAnswer(attempt.id, 1, {
        answerId: question.answers[0].id,
        expectedVersion: 2,
      })
    ).status,
  ).toBe(409)
})

it('reveals review content and notes only after finishing and paginates review and history for the owner', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const pathId = await resolveFixturePath(configuration)
  await createMockExamFixture(pathId, [{ questionCount: 3, eligibleQuestions: 3 }], 2)
  const learner = await mockExamLearner(api, configuration)
  const attempt = await learner.started()
  const question = await learner.question(attempt.id, 1)

  if (question === null) {
    throw new Error('Missing question')
  }

  expect(await (await learner.request(`/attempts/${attempt.id}/review`)).json()).toMatchObject({
    data: [],
  })
  const wrongAnswer = question.answers.find(answer => answer.text === 'B')

  if (wrongAnswer === undefined) {
    throw new Error('Missing wrong fixture answer')
  }

  await learner.saveAnswer(attempt.id, question.position, {
    answerId: wrongAnswer.id,
    expectedVersion: question.version,
  })
  const other = await mockExamLearner(api, configuration)
  expect(await other.attempt(attempt.id)).toBeNull()
  expect(await (await other.request(`/attempts/${attempt.id}/finish`, 'POST')).json()).toBeNull()
  await learner.request(`/attempts/${attempt.id}/finish`, 'POST')

  const first = await decodeResponse(AttemptReviewResponse)(
    await learner.request(`/attempts/${attempt.id}/review?limit=2`),
  )

  expect(first.data.map(row => row.position)).toStrictEqual([1, 2])
  expect(first.meta.hasMore).toBe(true)
  expect(
    first.data[0]?.answers.find(answer => answer.id === first.data[0]?.correctAnswerId)?.text,
  ).toBe('A')
  expect((await learner.attempt(attempt.id))?.result).toMatchObject({
    correct: 0,
    incorrect: 3,
    unanswered: 2,
  })
  expect(first.data[0]).toMatchObject({
    body: question.body,
    selectedAnswerId: wrongAnswer.id,
    isFavorite: false,
    note: null,
    explanation: { content: { version: 1 } },
  })

  const second = await decodeResponse(AttemptReviewResponse)(
    await learner.request(`/attempts/${attempt.id}/review?limit=2&cursor=${first.meta.nextCursor}`),
  )

  expect(second.data.map(row => row.position)).toStrictEqual([3])
  expect(second.meta.hasMore).toBe(false)
  expect(await (await other.request(`/attempts/${attempt.id}/review`)).json()).toMatchObject({
    data: [],
  })
  expect((await learner.request(`/attempts/${attempt.id}/review?cursor=invalid`)).status).toBe(400)
  const next = await learner.started()
  await learner.request(`/attempts/${next.id}/finish`, 'POST')

  const historyResponse = await learner.request('/history?limit=1')
  const history = await decodeResponse(MockExamHistoryResponse)(historyResponse)

  expect(history.data.map(row => row.id)).toStrictEqual([next.id])
  expect(history.meta.hasMore).toBe(true)

  const older = await decodeResponse(MockExamHistoryResponse)(
    await learner.request(`/history?limit=1&cursor=${history.meta.nextCursor}`),
  )

  expect(older.data.map(row => row.id)).toStrictEqual([attempt.id])
  expect(older.meta.hasMore).toBe(false)
  expect(await (await other.request('/history')).json()).toMatchObject({ data: [] })
})

it('fails below the threshold and gives an incomplete result after withdrawal while retaining valid section scores', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const pathId = await resolveFixturePath(configuration)
  await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 2 }], 2)
  const learner = await mockExamLearner(api, configuration)
  const attempt = await learner.started()
  const questions = await learner.questions(attempt)
  const first = questions[0]
  const second = questions[1]
  const answer = first?.answers.find(option => option.text === 'A')

  if (first === undefined || second === undefined || answer === undefined) {
    throw new Error('Missing fixture question')
  }

  await learner.saveAnswer(attempt.id, first.position, {
    answerId: answer.id,
    expectedVersion: first.version,
  })

  const finished = await decodeResponse(MockExamAttempt)(
    await learner.request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect(finished.result).toMatchObject({ correct: 1, percent: 50, passed: false })
  const next = await learner.started()
  const withdrawn = await learner.question(next.id, 1)

  if (withdrawn === null) {
    throw new Error('Missing question')
  }

  await withdrawFixtureRevision(withdrawn.questionRevisionId)

  const incomplete = await decodeResponse(MockExamAttempt)(
    await learner.request(`/attempts/${next.id}/finish`, 'POST'),
  )

  expect(incomplete.result).toMatchObject({ correct: 0, passed: null, sections: [{ correct: 0 }] })
  expect((await learner.attempt(attempt.id))?.result).toStrictEqual(finished.result)
})
