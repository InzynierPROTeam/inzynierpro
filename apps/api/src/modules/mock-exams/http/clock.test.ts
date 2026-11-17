import {
  AttemptReviewResponse,
  MockExamAttempt,
  MockExamHistoryResponse,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { DateTime, Effect } from 'effect'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { finishAttemptAtDeadline } from '~api/modules/mock-exams/application/attempt-deadline.job.js'
import { AttemptDeadlineNotReached } from '~api/modules/mock-exams/domain/errors.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { catalogueTestTime, fixedWallClockLayer } from '~api/test/clock.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { decodeResponse, mockExamLearner } from '~api/test/mock-exam-learner.js'
import { runFixture } from '~api/test/run-fixture.js'

const examPath = mockExamPathConfiguration('60000000-0000-4000-8000-000000000001')
const afterDeadline = DateTime.add(catalogueTestTime, { minutes: 10, seconds: 1 })

let api: TestApi
let lateApi: TestApi

beforeAll(async () => {
  ;[api, lateApi] = await Promise.all([startTestApi(), startTestApi({ now: afterDeadline })])
})

afterAll(() => Promise.all([api.close(), lateApi.close()]))

const startedExam = async () => {
  const pathId = await resolveFixturePath(examPath)
  await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 2 }], 1)
  const learner = await mockExamLearner(api, examPath)
  const attempt = await learner.started()
  const [first] = await learner.questions(attempt)
  const correct = first?.answers.find(answer => answer.text === 'A')

  if (first === undefined || correct === undefined) {
    throw new Error('Missing correct fixture answer')
  }

  await learner.saveAnswer(attempt.id, first.position, {
    answerId: correct.id,
    expectedVersion: first.version,
  })

  return { learner, attempt, first }
}

const runDeadlineJob = (
  learner: Awaited<ReturnType<typeof mockExamLearner>>,
  attempt: MockExamAttempt,
  now: DateTime.Utc,
) =>
  runFixture(
    finishAttemptAtDeadline({
      attemptId: attempt.id,
      userId: learner.userId,
      qualificationPathId: learner.pathId,
      deadline: DateTime.makeUnsafe(attempt.deadline),
    }).pipe(Effect.provide(fixedWallClockLayer(now))),
  )

it('returns the backend deadline and server time with the attempt', async () => {
  const { attempt } = await startedExam()

  expect(attempt).toMatchObject({
    startedAt: '2026-11-13T12:00:00.000Z',
    deadline: '2026-11-13T12:10:00.000Z',
    serverTime: '2026-11-13T12:00:00.000Z',
    endReason: null,
  })
})

it('refuses a write after the deadline and finishes the attempt from the saved answers', async () => {
  const { learner, attempt, first } = await startedExam()
  const late = learner.on(lateApi)

  const refused = await late.flag(attempt.id, first.position, {
    isFlagged: true,
    expectedVersion: 2,
  })

  expect(refused.status).toBe(409)
  expect(await late.attempt(attempt.id)).toMatchObject({
    status: 'finished',
    endReason: 'time-expired',
    finishedAt: '2026-11-13T12:10:00.000Z',
    serverTime: '2026-11-13T12:10:01.000Z',
    result: { correct: 1, incorrect: 1, unanswered: 1, activeSeconds: 600 },
  })
})

it('finishes an expired attempt on the first read after the deadline', async () => {
  const { learner, attempt } = await startedExam()

  expect(await learner.on(lateApi).question(attempt.id, 2)).not.toBeNull()
  expect(await learner.attempt(attempt.id)).toMatchObject({
    status: 'finished',
    endReason: 'time-expired',
  })
  expect((await learner.on(lateApi).preview()).unfinishedAttempt).toBeNull()
})

it('submits with time expired when finishing is requested after the deadline', async () => {
  const { learner, attempt } = await startedExam()

  const finished = await decodeResponse(MockExamAttempt)(
    await learner.on(lateApi).request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect(finished).toMatchObject({ status: 'finished', endReason: 'time-expired' })
})

it('starts a new attempt when the unfinished one has expired', async () => {
  const { learner, attempt } = await startedExam()

  const next = await learner.on(lateApi).started()

  expect(next.id).not.toBe(attempt.id)
  expect(await learner.attempt(attempt.id)).toMatchObject({ endReason: 'time-expired' })
})

it('finishes an attempt nobody returns to when its deadline job runs', async () => {
  const { learner, attempt } = await startedExam()

  await runDeadlineJob(learner, attempt, afterDeadline)

  expect(await learner.attempt(attempt.id)).toMatchObject({
    status: 'finished',
    endReason: 'time-expired',
    result: { correct: 1, unanswered: 1 },
  })
})

it('retries a deadline job that runs before the deadline and leaves the attempt running', async () => {
  const { learner, attempt } = await startedExam()

  await expect(runDeadlineJob(learner, attempt, catalogueTestTime)).rejects.toBeInstanceOf(
    AttemptDeadlineNotReached,
  )
  expect(await learner.attempt(attempt.id)).toMatchObject({ status: 'in-progress' })
})

it('produces one result when lazy and worker finishing run concurrently', async () => {
  const { learner, attempt } = await startedExam()
  const late = learner.on(lateApi)

  const [read, finished] = await Promise.all([
    late.attempt(attempt.id),
    decodeResponse(MockExamAttempt)(await late.request(`/attempts/${attempt.id}/finish`, 'POST')),
    runDeadlineJob(learner, attempt, afterDeadline),
    runDeadlineJob(learner, attempt, afterDeadline),
    late.question(attempt.id, 1),
  ])

  const history = await decodeResponse(MockExamHistoryResponse)(await late.request('/history'))

  expect(history.data).toHaveLength(1)
  expect(history.data[0]).toMatchObject({ id: attempt.id, endReason: 'time-expired' })
  expect(read?.result).toStrictEqual(finished.result)
  expect(history.data[0]?.result).toStrictEqual(finished.result)
})

it('finishes an expired attempt when history or its review is read after the deadline', async () => {
  const first = await startedExam()
  const late = first.learner.on(lateApi)

  const history = await decodeResponse(MockExamHistoryResponse)(await late.request('/history'))

  expect(history.data[0]).toMatchObject({ id: first.attempt.id, endReason: 'time-expired' })

  const second = await startedExam()

  const review = await decodeResponse(AttemptReviewResponse)(
    await second.learner.on(lateApi).request(`/attempts/${second.attempt.id}/review`),
  )

  expect(review.data).toHaveLength(2)
})
