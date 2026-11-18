import { LearningXpResponse } from '@inzpro/api-contracts/modules/learning-xp/responses'
import {
  AttemptReviewResponse,
  MockExamHistoryResponse,
  MockExamAttempt,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { DateTime } from 'effect'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { decodeResponse, mockExamLearner } from '~api/test/mock-exam-learner.js'
import { learningRequest } from '~api/test/preparation.js'
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
  expect(finished.earnedXp).toBe(12)
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
  expect(incomplete.earnedXp).toBe(10)
  expect((await learner.attempt(attempt.id))?.result).toStrictEqual(finished.result)
})

it('scores only valid questions and freezes incomplete results in history and review', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const pathId = await resolveFixturePath(configuration)
  await createMockExamFixture(
    pathId,
    [
      { questionCount: 3, eligibleQuestions: 3 },
      { questionCount: 1, eligibleQuestions: 1 },
    ],
    3,
  )
  const learner = await mockExamLearner(api, configuration)
  const attempt = await learner.started()
  const questions = await learner.questions(attempt)
  const ordered = [...questions].sort((left, right) => left.section - right.section)

  const withdrawnPositions = new Set(
    ordered.filter((_, index) => index === 1 || index === 3).map(question => question.position),
  )

  for (const [index, question] of ordered.entries()) {
    const answer = question.answers.find(option => option.text === 'A')

    if (answer === undefined) {
      throw new Error('Missing correct fixture answer')
    }

    if (index !== 2) {
      expect(
        (
          await learner.saveAnswer(attempt.id, question.position, {
            answerId: answer.id,
            expectedVersion: question.version,
          })
        ).status,
      ).toBe(200)
    }

    if (withdrawnPositions.has(question.position)) {
      await withdrawFixtureRevision(question.questionRevisionId)
    }
  }

  const finished = await decodeResponse(MockExamAttempt)(
    await learner.request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect(finished.result).toMatchObject({
    correct: 1,
    incorrect: 1,
    unanswered: 1,
    percent: 50,
    passed: null,
    sections: [
      { questionCount: 2, correct: 1 },
      { questionCount: 0, correct: 0 },
    ],
  })
  expect(finished.earnedXp).toBe(12)
  const valid = ordered[0]

  if (valid === undefined) {
    throw new Error('Missing valid question')
  }

  await withdrawFixtureRevision(valid.questionRevisionId)
  expect((await learner.attempt(attempt.id))?.result).toStrictEqual(finished.result)
  const history = await decodeResponse(MockExamHistoryResponse)(await learner.request('/history'))
  expect(history.data[0]?.result).toStrictEqual(finished.result)

  const review = await decodeResponse(AttemptReviewResponse)(
    await learner.request(`/attempts/${attempt.id}/review`),
  )

  expect(review.data.map(question => question.isWithdrawn)).toStrictEqual(
    questions.map(question => withdrawnPositions.has(question.position)),
  )
})

it('finishes with no scored questions when every question was withdrawn', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const pathId = await resolveFixturePath(configuration)
  await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 2 }], 1)
  const learner = await mockExamLearner(api, configuration)
  const attempt = await learner.started()
  const questions = await learner.questions(attempt)

  for (const question of questions) {
    await withdrawFixtureRevision(question.questionRevisionId)
  }

  const finished = await decodeResponse(MockExamAttempt)(
    await learner.request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect(finished.result).toMatchObject({
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    percent: 0,
    passed: null,
    sections: [{ questionCount: 0, correct: 0 }],
  })
})

it('awards final answer XP and caps finished exam rewards at three per Warsaw day', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const pathId = await resolveFixturePath(configuration)
  await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 2 }], 1)
  const learner = await mockExamLearner(api, configuration)

  const total = async () =>
    decodeResponse(LearningXpResponse)(
      await learner.visitor.jar.fetch(new URL('/api/v1/learning-xp', api.baseUrl)),
    )

  for (const expected of [23, 23, 23, 3]) {
    const attempt = await learner.started()
    const questions = await learner.questions(attempt)

    for (const question of questions) {
      const answer = question.answers.find(
        option => option.text === (question.position === 1 ? 'A' : 'B'),
      )!

      expect(
        (
          await learner.saveAnswer(attempt.id, question.position, {
            answerId: answer.id,
            expectedVersion: question.version,
          })
        ).status,
      ).toBe(200)
    }

    const before = await total()
    const response = await learner.request(`/attempts/${attempt.id}/finish`, 'POST')
    expect(response.status).toBe(200)
    const finished = await response.json()
    expect(finished).toMatchObject({ earnedXp: expected })
    expect(await total()).toEqual({ total: before.total + expected })
    expect(await (await learner.request(`/attempts/${attempt.id}/finish`, 'POST')).json()).toEqual(
      finished,
    )
    expect(await total()).toEqual({ total: before.total + expected })
  }
})

it('shares the finished exam limit across paths under concurrency and renews it at Warsaw midnight', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000003')
  const otherConfiguration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000004')
  const pathId = await resolveFixturePath(configuration)
  const otherPathId = await resolveFixturePath(otherConfiguration)
  await createMockExamFixture(pathId, [{ questionCount: 1, eligibleQuestions: 1 }], 1)
  await createMockExamFixture(otherPathId, [{ questionCount: 1, eligibleQuestions: 1 }], 1)
  const learner = await mockExamLearner(api, configuration)
  expect(
    (await learningRequest(api, learner.visitor, '/onboarding', otherConfiguration)).status,
  ).toBe(200)

  for (let index = 0; index < 2; index++) {
    const attempt = await learner.started()
    expect(
      (
        await decodeResponse(MockExamAttempt)(
          await learner.request(`/attempts/${attempt.id}/finish`, 'POST'),
        )
      ).earnedXp,
    ).toBe(10)
  }

  const first = await learner.started()

  const otherRequest = (path: string) =>
    learner.visitor.jar.fetch(
      new URL(`/api/v1/mock-exams/paths/${otherPathId}${path}`, api.baseUrl),
      { method: 'POST' },
    )

  const second = await decodeResponse(MockExamAttempt)(await otherRequest('/attempts'))

  const ended = await Promise.all([
    learner.request(`/attempts/${first.id}/finish`, 'POST').then(decodeResponse(MockExamAttempt)),
    otherRequest(`/attempts/${second.id}/finish`).then(decodeResponse(MockExamAttempt)),
  ])

  expect(ended.map(attempt => attempt.earnedXp).sort((a, b) => a - b)).toEqual([0, 10])

  const tomorrow = await startTestApi({ now: DateTime.makeUnsafe('2026-11-13T23:00:00Z') })

  try {
    const next = learner.on(tomorrow)
    const attempt = await next.started()

    const finished = await decodeResponse(MockExamAttempt)(
      await next.request(`/attempts/${attempt.id}/finish`, 'POST'),
    )

    expect(finished.earnedXp).toBe(10)
  } finally {
    await tomorrow.close()
  }
})
