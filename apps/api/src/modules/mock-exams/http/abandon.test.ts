import {
  MockExamAttempt,
  MockExamHistoryResponse,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { DateTime } from 'effect'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { catalogueTestTime } from '~api/test/clock.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import {
  decodeResponse,
  mockExamLearner,
  decodeFinishedAttempt,
} from '~api/test/mock-exam-learner.js'

const examPath = mockExamPathConfiguration('60000000-0000-4000-8000-000000000010')
let api: TestApi
let lateApi: TestApi

beforeAll(async () => {
  ;[api, lateApi] = await Promise.all([
    startTestApi(),
    startTestApi({ now: DateTime.add(catalogueTestTime, { minutes: 11 }) }),
  ])
})

afterAll(() => Promise.all([api.close(), lateApi.close()]))

const startedExam = async () => {
  const pathId = await resolveFixturePath(examPath)
  await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 2 }], 1)
  const learner = await mockExamLearner(api, examPath)

  return { learner, attempt: await learner.started() }
}

it('abandons an attempt without a result, keeps it in history and allows a new attempt', async () => {
  const { learner, attempt } = await startedExam()

  const abandoned = await decodeResponse(MockExamAttempt)(
    await learner.request(`/attempts/${attempt.id}/abandon`, 'POST'),
  )

  expect(abandoned).toMatchObject({ status: 'abandoned', result: null, endReason: null })
  expect(await learner.attempt(attempt.id)).toStrictEqual(abandoned)
  expect(
    await (await learner.request(`/attempts/${attempt.id}/abandon`, 'POST')).json(),
  ).toStrictEqual(abandoned)
  expect(await (await learner.request(`/attempts/${attempt.id}/review`)).json()).toMatchObject({
    data: [],
  })
  const history = await decodeResponse(MockExamHistoryResponse)(await learner.request('/history'))
  expect(history.data).toMatchObject([{ id: attempt.id, status: 'abandoned', result: null }])
  expect((await learner.preview()).unfinishedAttempt).toBeNull()
  expect((await learner.started()).id).not.toBe(attempt.id)
})

it('allows abandoning while paused and refuses every further write', async () => {
  const { learner, attempt } = await startedExam()
  const question = await learner.question(attempt.id, 1)

  if (question === null || question.answers[0] === undefined) {
    throw new Error('Missing fixture question')
  }

  expect(
    (
      await learner.saveAnswer(attempt.id, 1, {
        answerId: question.answers[0].id,
        expectedVersion: question.version,
      })
    ).status,
  ).toBe(200)
  expect((await learner.request(`/attempts/${attempt.id}/pause`, 'POST')).status).toBe(200)
  expect(
    await decodeResponse(MockExamAttempt)(
      await learner.request(`/attempts/${attempt.id}/abandon`, 'POST'),
    ),
  ).toMatchObject({ status: 'abandoned', result: null, earnedXp: 0 })

  for (const action of ['finish', 'pause', 'resume']) {
    expect((await learner.request(`/attempts/${attempt.id}/${action}`, 'POST')).status).toBe(409)
  }

  expect(
    (
      await learner.saveAnswer(attempt.id, 1, {
        answerId: question.answers[0].id,
        expectedVersion: question.version + 1,
      })
    ).status,
  ).toBe(409)
  expect(
    (
      await learner.flag(attempt.id, 1, {
        isFlagged: true,
        expectedVersion: question.version + 1,
      })
    ).status,
  ).toBe(409)
  expect(await (await learner.studyRequest('/review-preview')).json()).toMatchObject({
    dueQuestionCount: 0,
    nextDueAt: null,
  })
  expect((await learner.started()).id).not.toBe(attempt.id)
})

it('refuses abandoning a finished attempt and hides foreign and missing attempts', async () => {
  const { learner, attempt } = await startedExam()
  const other = await mockExamLearner(api, examPath)
  const oralOnly = await mockExamLearner(api, examPath, 'oral')

  expect(await (await other.request(`/attempts/${attempt.id}/abandon`, 'POST')).json()).toBeNull()
  expect((await oralOnly.request(`/attempts/${attempt.id}/abandon`, 'POST')).status).toBe(403)
  expect(
    await (
      await learner.request('/attempts/b0000000-0000-4000-8000-000000000099/abandon', 'POST')
    ).json(),
  ).toBeNull()
  expect((await learner.attempt(attempt.id))?.status).toBe('in-progress')

  const finished = await decodeFinishedAttempt(
    await learner.request(`/attempts/${attempt.id}/finish`, 'POST'),
  )

  expect((await learner.request(`/attempts/${attempt.id}/abandon`, 'POST')).status).toBe(409)
  expect(await learner.attempt(attempt.id)).toStrictEqual(finished)
})

it('finishes an expired attempt instead of allowing it to escape scoring through abandonment', async () => {
  const { learner, attempt } = await startedExam()
  expect(
    (await learner.on(lateApi).request(`/attempts/${attempt.id}/abandon`, 'POST')).status,
  ).toBe(409)
  expect(await learner.attempt(attempt.id)).toMatchObject({
    status: 'finished',
    endReason: 'time-expired',
    result: { correct: 0 },
  })
})

it('keeps abandonment idempotent under concurrent requests and after the original deadline', async () => {
  const { learner, attempt } = await startedExam()

  const responses = await Promise.all([
    learner.request(`/attempts/${attempt.id}/abandon`, 'POST'),
    learner.request(`/attempts/${attempt.id}/abandon`, 'POST'),
  ])

  for (const response of responses) {
    expect(await decodeResponse(MockExamAttempt)(response)).toMatchObject({
      status: 'abandoned',
      result: null,
    })
  }

  expect(await learner.on(lateApi).attempt(attempt.id)).toMatchObject({
    status: 'abandoned',
    result: null,
  })
})

it('retains pause counts and time in abandoned history without creating a score', async () => {
  const { learner, attempt } = await startedExam()
  expect((await learner.request(`/attempts/${attempt.id}/pause`, 'POST')).status).toBe(200)
  expect(
    (await learner.on(lateApi).request(`/attempts/${attempt.id}/abandon`, 'POST')).status,
  ).toBe(200)
  const history = await decodeResponse(MockExamHistoryResponse)(await learner.request('/history'))
  expect(history.data[0]).toMatchObject({
    status: 'abandoned',
    result: null,
    pauseCount: 1,
    pauseSeconds: 660,
  })
})
