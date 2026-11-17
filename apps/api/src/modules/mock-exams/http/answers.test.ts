import { AttemptQuestionConflict } from '@inzpro/api-contracts/modules/mock-exams/errors'
import { AttemptQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

const examPath = mockExamPathConfiguration('60000000-0000-4000-8000-000000000007')

const startedExam = async (questionCount = 2) => {
  const pathId = await resolveFixturePath(examPath)

  const fixture = await createMockExamFixture(
    pathId,
    [{ questionCount, eligibleQuestions: questionCount }],
    1,
  )

  const learner = await mockExamLearner(api, examPath)
  const attempt = await learner.started()
  const question = await learner.question(attempt.id, 1)

  if (question === null) {
    throw new Error('Expected the first attempt question')
  }

  return { learner, attempt, question, fixture }
}

const option = (question: AttemptQuestion, index: number) => {
  const answer = question.answers[index]

  if (answer === undefined) {
    throw new Error(`Expected answer option ${index}`)
  }

  return answer.id
}

describe('mock exam draft answers', () => {
  it('starts every question unanswered, unflagged and at the first version', async () => {
    const { learner, attempt, question } = await startedExam()

    expect(question).toMatchObject({ selectedAnswerId: null, isFlagged: false, version: 1 })
    expect((await learner.attempt(attempt.id))?.questions).toStrictEqual([
      { position: 1, isAnswered: false, isFlagged: false },
      { position: 2, isAnswered: false, isFlagged: false },
    ])
  })

  it('saves and changes an answer any number of times without revealing correctness', async () => {
    const { learner, attempt, question } = await startedExam()

    const saved = await learner.saveAnswer(attempt.id, 1, {
      answerId: option(question, 0),
      expectedVersion: 1,
    })

    expect(saved.status).toBe(200)
    const first = await decodeResponse(AttemptQuestion)(saved)

    expect(first).toMatchObject({ selectedAnswerId: option(question, 0), version: 2 })

    const changed = await decodeResponse(AttemptQuestion)(
      await learner.saveAnswer(attempt.id, 1, {
        answerId: option(question, 2),
        expectedVersion: 2,
      }),
    )

    expect(changed).toMatchObject({ selectedAnswerId: option(question, 2), version: 3 })
    expect(await learner.question(attempt.id, 1)).toStrictEqual(changed)
    expect(JSON.stringify(changed)).not.toMatch(/isCorrect|explanation|note/)
  })

  it('refuses a stale write with the current state of the question and overwrites nothing', async () => {
    const { learner, attempt, question } = await startedExam()

    await learner.saveAnswer(attempt.id, 1, { answerId: option(question, 0), expectedVersion: 1 })

    const stale = await learner.saveAnswer(attempt.id, 1, {
      answerId: option(question, 1),
      expectedVersion: 1,
    })

    expect(stale.status).toBe(409)
    const conflict = Schema.decodeUnknownSync(AttemptQuestionConflict)(await stale.json())

    expect(conflict.question).toMatchObject({ selectedAnswerId: option(question, 0), version: 2 })
    expect(await learner.question(attempt.id, 1)).toStrictEqual(conflict.question)

    const staleFlag = await learner.flag(attempt.id, 1, { isFlagged: true, expectedVersion: 1 })

    expect(staleFlag.status).toBe(409)
    expect(await learner.question(attempt.id, 1)).toMatchObject({ isFlagged: false, version: 2 })
  })

  it('accepts a retried write that the question already reflects', async () => {
    const { learner, attempt, question } = await startedExam()
    const write = { answerId: option(question, 1), expectedVersion: 1 }

    const saved = await decodeResponse(AttemptQuestion)(
      await learner.saveAnswer(attempt.id, 1, write),
    )

    const retried = await learner.saveAnswer(attempt.id, 1, write)

    expect(retried.status).toBe(200)
    expect(await decodeResponse(AttemptQuestion)(retried)).toStrictEqual(saved)

    await learner.flag(attempt.id, 1, { isFlagged: true, expectedVersion: 2 })
    const retriedFlag = await learner.flag(attempt.id, 1, { isFlagged: true, expectedVersion: 2 })

    expect(await decodeResponse(AttemptQuestion)(retriedFlag)).toMatchObject({
      isFlagged: true,
      version: 3,
    })
  })

  it('flags and unflags a question and shows answered and flagged questions in the attempt', async () => {
    const { learner, attempt, question } = await startedExam(3)

    await learner.saveAnswer(attempt.id, 1, { answerId: option(question, 0), expectedVersion: 1 })

    const flagged = await decodeResponse(AttemptQuestion)(
      await learner.flag(attempt.id, 2, { isFlagged: true, expectedVersion: 1 }),
    )

    expect(flagged).toMatchObject({ selectedAnswerId: null, isFlagged: true, version: 2 })

    await learner.flag(attempt.id, 3, { isFlagged: true, expectedVersion: 1 })
    await learner.flag(attempt.id, 3, { isFlagged: false, expectedVersion: 2 })

    expect((await learner.attempt(attempt.id))?.questions).toStrictEqual([
      { position: 1, isAnswered: true, isFlagged: false },
      { position: 2, isAnswered: false, isFlagged: true },
      { position: 3, isAnswered: false, isFlagged: false },
    ])
  })

  it('refuses an answer outside the question and an answer to a withdrawn question', async () => {
    const { learner, attempt, question } = await startedExam()
    const second = await learner.question(attempt.id, 2)

    if (second === null) {
      throw new Error('Expected the second attempt question')
    }

    const foreign = await learner.saveAnswer(attempt.id, 1, {
      answerId: option(second, 0),
      expectedVersion: 1,
    })

    expect(foreign.status).toBe(422)

    await withdrawFixtureRevision(question.questionRevisionId)

    const withdrawn = await learner.saveAnswer(attempt.id, 1, {
      answerId: option(question, 0),
      expectedVersion: 1,
    })

    expect(withdrawn.status).toBe(409)
    expect(await learner.question(attempt.id, 1)).toMatchObject({
      isWithdrawn: true,
      selectedAnswerId: null,
      version: 1,
    })
  })

  it("refuses writes to another account's attempt and to a missing question", async () => {
    const { learner, attempt, question } = await startedExam()
    const other = await mockExamLearner(api, examPath)
    const write = { answerId: option(question, 0), expectedVersion: 1 }

    expect((await learner.saveAnswer(attempt.id, 3, write)).status).toBe(404)
    expect((await other.saveAnswer(attempt.id, 1, write)).status).toBe(404)
    expect((await other.flag(attempt.id, 1, { isFlagged: true, expectedVersion: 1 })).status).toBe(
      404,
    )
  })

  it('records no learning events, so written statistics and reviews stay unchanged', async () => {
    const { learner, attempt, question } = await startedExam()

    const statistics = async () => {
      const coverage = await learner.studyRequest('/documents')
      const reviews = await learner.studyRequest('/review-preview')

      expect([coverage.status, reviews.status]).toStrictEqual([200, 200])

      return { coverage: await coverage.text(), reviews: await reviews.text() }
    }

    const before = await statistics()

    await learner.saveAnswer(attempt.id, 1, { answerId: option(question, 0), expectedVersion: 1 })
    await learner.saveAnswer(attempt.id, 1, { answerId: option(question, 1), expectedVersion: 2 })

    expect(await statistics()).toStrictEqual(before)
  })
})
