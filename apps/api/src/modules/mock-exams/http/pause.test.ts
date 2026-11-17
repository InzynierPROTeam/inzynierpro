import { MockExamAttemptPaused } from '@inzpro/api-contracts/modules/mock-exams/errors'
import {
  MockExamAttempt,
  MockExamAttemptResponse,
  MockExamHistoryResponse,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { DateTime, Effect, Schema } from 'effect'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { finishAttemptAtDeadline } from '~api/modules/mock-exams/application/attempt-deadline.job.js'
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

const minutesIn = (minutes: number, seconds = 0) =>
  DateTime.add(catalogueTestTime, { minutes, seconds })

let api: TestApi
let pausingApi: TestApi
let resumingApi: TestApi
let finishingApi: TestApi
let lateApi: TestApi

beforeAll(async () => {
  ;[api, pausingApi, resumingApi, finishingApi, lateApi] = await Promise.all([
    startTestApi(),
    startTestApi({ now: minutesIn(2) }),
    startTestApi({ now: minutesIn(5) }),
    startTestApi({ now: minutesIn(7) }),
    startTestApi({ now: minutesIn(10, 1) }),
  ])
})

afterAll(() =>
  Promise.all([api, pausingApi, resumingApi, finishingApi, lateApi].map(test => test.close())),
)

const startedExam = async () => {
  const pathId = await resolveFixturePath(examPath)
  await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 2 }], 1)
  const learner = await mockExamLearner(api, examPath)
  const attempt = await learner.started()
  const [first] = await learner.questions(attempt)

  if (first === undefined) {
    throw new Error('Missing first attempt question')
  }

  return { learner, attempt, first }
}

type Learner = Awaited<ReturnType<typeof mockExamLearner>>

const command = async (
  learner: Pick<Learner, 'request'>,
  attemptId: string,
  action: 'pause' | 'resume',
) =>
  decodeResponse(MockExamAttempt)(await learner.request(`/attempts/${attemptId}/${action}`, 'POST'))

const runDeadlineJob = (
  learner: Learner,
  attemptId: MockExamAttemptId,
  deadline: string,
  now: DateTime.Utc,
) =>
  runFixture(
    finishAttemptAtDeadline({
      attemptId,
      userId: learner.userId,
      qualificationPathId: learner.pathId,
      deadline: DateTime.makeUnsafe(deadline),
    }).pipe(Effect.provide(fixedWallClockLayer(now))),
  )

it('stops the clock while paused and moves the deadline by the pause length on resume', async () => {
  const { learner, attempt } = await startedExam()

  expect(await command(learner.on(pausingApi), attempt.id, 'pause')).toMatchObject({
    status: 'paused',
    deadline: '2026-11-13T12:10:00.000Z',
    serverTime: '2026-11-13T12:02:00.000Z',
  })
  expect(await learner.on(resumingApi).attempt(attempt.id)).toMatchObject({
    status: 'paused',
    deadline: '2026-11-13T12:13:00.000Z',
    serverTime: '2026-11-13T12:05:00.000Z',
  })
  expect(await command(learner.on(resumingApi), attempt.id, 'resume')).toMatchObject({
    status: 'in-progress',
    deadline: '2026-11-13T12:13:00.000Z',
  })
  expect(await learner.on(lateApi).attempt(attempt.id)).toMatchObject({ status: 'in-progress' })
})

it('repeats a pause or resume that already took effect without recording another pause', async () => {
  const { learner, attempt } = await startedExam()
  const pausing = learner.on(pausingApi)

  await command(pausing, attempt.id, 'pause')
  await command(learner.on(resumingApi), attempt.id, 'pause')
  await command(learner.on(resumingApi), attempt.id, 'resume')
  await command(learner.on(finishingApi), attempt.id, 'resume')

  const finished = await decodeResponse(MockExamAttempt)(
    await learner.on(finishingApi).request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect(finished.result).toMatchObject({ pauseCount: 1, pauseSeconds: 180, activeSeconds: 240 })
})

it('hides question content and refuses answer and flag writes while paused', async () => {
  const { learner, attempt, first } = await startedExam()
  const resuming = learner.on(resumingApi)

  await command(learner.on(pausingApi), attempt.id, 'pause')

  const read = await resuming.request(`/attempts/${attempt.id}/questions/1`)

  const answer = await resuming.saveAnswer(attempt.id, first.position, {
    answerId: first.answers[0]?.id ?? '',
    expectedVersion: first.version,
  })

  const flag = await resuming.flag(attempt.id, first.position, {
    isFlagged: true,
    expectedVersion: first.version,
  })

  for (const response of [read, answer, flag]) {
    expect(response.status).toBe(409)
    expect(Schema.decodeUnknownSync(MockExamAttemptPaused)(await response.json())).toBeInstanceOf(
      MockExamAttemptPaused,
    )
  }

  const attemptRead = await decodeResponse(MockExamAttemptResponse)(
    await resuming.request(`/attempts/${attempt.id}`),
  )

  expect(attemptRead?.questions).toStrictEqual([
    { position: 1, isAnswered: false, isFlagged: false },
    { position: 2, isAnswered: false, isFlagged: false },
  ])
})

it('does not let a deadline job scheduled before a pause finish the attempt', async () => {
  const { learner, attempt } = await startedExam()

  await command(learner.on(pausingApi), attempt.id, 'pause')
  await runDeadlineJob(learner, attempt.id, attempt.deadline, minutesIn(10, 1))

  expect(await learner.on(lateApi).attempt(attempt.id)).toMatchObject({ status: 'paused' })

  const resumed = await command(learner.on(resumingApi), attempt.id, 'resume')
  await runDeadlineJob(learner, attempt.id, attempt.deadline, minutesIn(13, 1))

  expect(await learner.on(lateApi).attempt(attempt.id)).toMatchObject({ status: 'in-progress' })

  await runDeadlineJob(learner, attempt.id, resumed.deadline, minutesIn(13, 1))

  expect(await learner.on(lateApi).attempt(attempt.id)).toMatchObject({
    status: 'finished',
    endReason: 'time-expired',
    finishedAt: '2026-11-13T12:13:00.000Z',
    result: { activeSeconds: 600, pauseCount: 1, pauseSeconds: 180 },
  })
})

it('finishes a paused attempt with the open pause excluded from its active time', async () => {
  const { learner, attempt } = await startedExam()

  await command(learner.on(pausingApi), attempt.id, 'pause')

  const finished = await decodeResponse(MockExamAttempt)(
    await learner.on(resumingApi).request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect(finished).toMatchObject({
    status: 'finished',
    endReason: 'submitted',
    result: { activeSeconds: 120, pauseCount: 1, pauseSeconds: 180 },
  })

  const history = await decodeResponse(MockExamHistoryResponse)(
    await learner.on(resumingApi).request('/history'),
  )

  expect(history.data[0]?.result).toMatchObject({ pauseCount: 1, pauseSeconds: 180 })
})

it('refuses to pause or resume an attempt that has ended or run out of time', async () => {
  const { learner, attempt } = await startedExam()

  const late = await learner.on(lateApi).request(`/attempts/${attempt.id}/pause`, 'POST')

  expect(late.status).toBe(409)
  expect(await learner.attempt(attempt.id)).toMatchObject({ endReason: 'time-expired' })

  const resumed = await learner.request(`/attempts/${attempt.id}/resume`, 'POST')

  expect(resumed.status).toBe(409)
})
