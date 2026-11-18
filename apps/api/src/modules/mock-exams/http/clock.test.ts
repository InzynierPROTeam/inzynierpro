import {
  AttemptReviewResponse,
  MockExamAttempt,
  MockExamHistoryResponse,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import {
  StudySession,
  SessionQuestion,
  SessionPreview,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { DateTime, Effect, Layer, Option } from 'effect'
import { afterAll, beforeAll, expect, it, onTestFinished } from 'vitest'
import { XpReader } from '~api/modules/learning-xp/application/learning-xp.reader.js'
import type { XpPeriod } from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
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
import { learningRequest } from '~api/test/preparation.js'
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

  const { documents } = await createMockExamFixture(
    pathId,
    [{ questionCount: 2, eligibleQuestions: 2 }],
    1,
  )

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

  return { learner, attempt, first, documentId: documents[0]!.documentId }
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

it('records the time XP totals are reached when an expired exam is processed after newer study XP', async () => {
  const { learner, attempt, documentId } = await startedExam()
  const studyAt = DateTime.add(catalogueTestTime, { hours: 2 })
  const processedAt = DateTime.add(catalogueTestTime, { hours: 3 })
  const studyApi = await startTestApi({ now: studyAt })
  onTestFinished(() => studyApi.close())

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(studyApi, learner.visitor, `/paths/${learner.pathId}${path}`, body)

  const preview = await decodeResponse(SessionPreview)(
    await request(`/preview?documentId=${documentId}`),
  )

  const session = await decodeResponse(StudySession)(
    await request('/sessions', {
      documentId,
      questionCount: preview.settings.defaultQuestionCount,
      questionSelection: preview.questionSelection,
    }),
  )

  const question = await decodeResponse(SessionQuestion)(
    await request(`/sessions/${session.id}/questions/1`),
  )

  const answer = await decodeResponse(SubmitSessionAnswerResponse)(
    await request(`/sessions/${session.id}/questions/1/answer`, {
      questionRevisionId: question.questionRevisionId,
      answerId: question.answers.find(option => option.isCorrect)!.id,
    }),
  )

  expect(answer.awardedXp).toBe(3)

  const readTotal = (period: XpPeriod) =>
    Effect.runPromise(
      XpReader.use(xpReader => xpReader.periodTotal(learner.userId, period)).pipe(
        Effect.provide(XpReaderLive.pipe(Layer.provide(databaseLayerFromConfig))),
        Effect.scoped,
        Effect.map(Option.getOrThrow),
      ),
    )

  expect(await readTotal({ kind: 'all_time', key: 'all' })).toEqual({
    total: 3,
    reachedAt: studyAt,
  })

  await runDeadlineJob(learner, attempt, processedAt)
  expect(await learner.attempt(attempt.id)).toMatchObject({
    finishedAt: attempt.deadline,
    earnedXp: 22,
  })

  for (const period of [
    { kind: 'all_time', key: 'all' },
    { kind: 'week', key: '2026-11-09' },
    { kind: 'month', key: '2026-11-01' },
    { kind: 'exam_session', key: examPath.examSessionId },
  ] as const) {
    expect(await readTotal(period)).toEqual({ total: 25, reachedAt: processedAt })
  }

  await runDeadlineJob(learner, attempt, DateTime.add(processedAt, { hours: 1 }))
  expect(await readTotal({ kind: 'all_time', key: 'all' })).toEqual({
    total: 25,
    reachedAt: processedAt,
  })
})
