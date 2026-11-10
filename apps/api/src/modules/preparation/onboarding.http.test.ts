import { databaseLayerFromConfig } from '@inzpro/db'
import { ApiDateTime } from '@inzpro/domain/common/date-time'
import { Effect, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/exam-calendar.repository.js'
import { CalendarSession } from '~api/modules/exam-calendar/session.model.js'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { runFixture } from '~api/test/learning-fixtures.js'
import {
  loginForPreparation,
  learningRequest,
  technicalConfiguration,
  technicalPathA,
  technicalPathB,
} from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  await Effect.runPromise(
    seedTechnicalCatalogue.pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped),
  )
  api = await startTestApi()
})

afterAll(() => api.close())

const pathId = technicalPathA
const config = { ...technicalConfiguration, accessScope: 'written' }

const publicRequest = (path: string) =>
  api.visitor().jar.fetch(new URL(`/api/v1${path}`, api.baseUrl))

test('guest onboarding uses separate cursor catalogues and only persistence requires authentication', async () => {
  const first = await (await publicRequest('/qualification-paths/specializations?limit=1')).json()
  expect(first).toMatchObject({
    data: [{ id: config.specializationId }],
    meta: { hasMore: true, nextCursor: config.specializationId },
  })

  const second = await (
    await publicRequest(
      `/qualification-paths/specializations?limit=1&cursor=${config.specializationId}`,
    )
  ).json()

  expect(second).toMatchObject({
    data: [{ id: '60000000-0000-4000-8000-000000000002' }],
    meta: { hasMore: false },
  })
  expect((await publicRequest('/qualification-paths/specializations?cursor=bad')).status).toBe(400)
  expect((await publicRequest('/qualification-paths/qualification-kinds')).status).toBe(400)
  expect(
    await (
      await publicRequest(
        `/qualification-paths/qualification-kinds?specializationId=${config.specializationId}`,
      )
    ).json(),
  ).toMatchObject({ data: [{ id: config.qualificationKindId }], meta: { hasMore: false } })
  expect(
    await (
      await publicRequest(
        `/qualification-paths/qualification-scopes?specializationId=${config.specializationId}&qualificationKindId=${config.qualificationKindId}`,
      )
    ).json(),
  ).toMatchObject({
    data: expect.arrayContaining([expect.objectContaining({ id: config.qualificationScopeId })]),
  })
  expect(
    await (
      await publicRequest(`/exam-calendar/sessions?specializationId=${config.specializationId}`)
    ).json(),
  ).toMatchObject({
    data: expect.arrayContaining([expect.objectContaining({ id: config.examSessionId })]),
  })

  const resolved = await (
    await publicRequest(
      `/qualification-paths/resolve?specializationId=${config.specializationId}&qualificationKindId=${config.qualificationKindId}&qualificationScopeId=${config.qualificationScopeId}`,
    )
  ).json()

  expect(resolved).toMatchObject({ path: { id: pathId } })
  expect((await learningRequest(api, api.visitor(), '/onboarding', config)).status).toBe(401)
  expect((await learningRequest(api, api.visitor(), `/paths/${pathId}`)).status).toBe(401)
})

test('confirmation atomically creates one assignment and version even for concurrent retries', async () => {
  const visitor = await loginForPreparation(api)
  const request = <Body>(path: string, body?: Body) => learningRequest(api, visitor, path, body)
  expect(await (await request('/paths')).json()).toMatchObject({
    data: [],
    meta: { hasMore: false },
  })
  expect(await (await request('/selection')).json()).toEqual({ path: null })

  const replies = await Promise.all([
    request('/onboarding', config),
    request('/onboarding', config),
  ])

  expect(replies.map(reply => reply.status)).toEqual([200, 200])
  expect(await (await request('/paths')).json()).toMatchObject({
    data: [{ id: pathId, goal: { version: 1 }, accessScope: 'written' }],
  })
  expect(await (await request('/selection')).json()).toMatchObject({ path: { id: pathId } })
  expect(await (await request(`/paths/${pathId}/goals`)).json()).toMatchObject({
    data: [{ version: 1 }],
    meta: { hasMore: false },
  })
  expect((await request(`/paths/${pathId}/oral`)).status).toBe(403)
  expect((await request(`/paths/${pathId}/documents`)).status).toBe(200)
})

test('invalid combinations, foreign or closed sessions and malformed UTC dates leave no assignment', async () => {
  const visitor = await loginForPreparation(api)

  for (const patch of [
    { qualificationScopeId: '80000000-0000-4000-8000-000000000002' },
    { examSessionId: '90000000-0000-4000-8000-000000000002' },
    { examSessionId: '90000000-0000-4000-8000-000000000004' },
    { oralExamDate: '2027-02-31T00:00:00.000Z' },
    { oralExamDate: '2027-02-20' },
    { oralExamDate: '2027-02-20T00:00:00+01:00' },
  ]) {
    expect(
      (await learningRequest(api, visitor, '/onboarding', { ...config, ...patch })).status,
    ).toBe(400)
  }

  expect(await (await learningRequest(api, visitor, '/paths')).json()).toMatchObject({ data: [] })
})

test('scope extension, UTC instants, goal conflicts and cursor history preserve account isolation', async () => {
  const visitor = await loginForPreparation(api)
  const other = await loginForPreparation(api)
  const request = <Body>(path: string, body?: Body) => learningRequest(api, visitor, path, body)
  await request('/onboarding', { ...config, accessScope: 'oral' })
  expect((await request(`/paths/${pathId}/documents`)).status).toBe(403)
  expect((await request(`/paths/${pathId}/oral`)).status).toBe(200)
  expect((await learningRequest(api, other, `/paths/${pathId}/extend`, {})).status).toBe(403)
  expect(await (await learningRequest(api, other, `/paths/${pathId}`)).json()).toEqual({
    path: null,
  })
  await request(`/paths/${pathId}/extend`, {})
  await request(`/paths/${pathId}/extend`, {})
  expect(await (await request(`/paths/${pathId}/goals`)).json()).toMatchObject({
    data: [{ version: 2 }, { version: 1 }],
  })

  const change = {
    expectedVersion: 2,
    examSessionId: config.examSessionId,
    oralExamDate: '2028-02-20T12:34:56.789Z',
  }

  expect((await request(`/paths/${pathId}/goal`, change)).status).toBe(200)
  expect((await request(`/paths/${pathId}/goal`, change)).status).toBe(200)
  expect(
    (
      await request(`/paths/${pathId}/goal`, {
        ...change,
        oralExamDate: '2028-02-21T09:30:00.000Z',
      })
    ).status,
  ).toBe(409)
  expect((await request(`/paths/${pathId}/goal`, { ...change, expectedVersion: 0 })).status).toBe(
    400,
  )
  expect(await (await request(`/paths/${pathId}/goals?limit=1`)).json()).toMatchObject({
    data: [{ version: 3, oralExamDate: change.oralExamDate }],
    meta: { hasMore: true, nextCursor: '3' },
  })
  expect(await (await request(`/paths/${pathId}/goals?limit=1&cursor=3`)).json()).toMatchObject({
    data: [{ version: 2 }],
    meta: { hasMore: true, nextCursor: '2' },
  })
  expect((await request(`/paths/${pathId}/documents`)).status).toBe(200)
})

test('archive falls back to another active assignment and restore preserves its latest goal', async () => {
  const visitor = await loginForPreparation(api)
  const request = <Body>(path: string, body?: Body) => learningRequest(api, visitor, path, body)
  await request('/onboarding', config)
  await request('/onboarding', {
    ...config,
    specializationId: '60000000-0000-4000-8000-000000000002',
    qualificationKindId: '70000000-0000-4000-8000-000000000002',
    qualificationScopeId: '80000000-0000-4000-8000-000000000002',
    examSessionId: '90000000-0000-4000-8000-000000000002',
  })
  expect(await (await request('/selection')).json()).toMatchObject({ path: { id: technicalPathB } })
  await request(`/paths/${technicalPathB}/archive`, {})
  expect(await (await request('/selection')).json()).toMatchObject({ path: { id: pathId } })
  await request(`/paths/${pathId}/archive`, {})
  expect(await (await request('/selection')).json()).toEqual({ path: null })
  expect(await (await request('/onboarding', config)).json()).toMatchObject({
    existing: true,
    archived: true,
  })
  await request(`/paths/${pathId}/restore`, {})
  expect(await (await request('/selection')).json()).toMatchObject({
    path: { id: pathId, goal: { version: 1 } },
  })
})

test('closing the selection window does not revoke access or break idempotent confirmation', async () => {
  const visitor = await loginForPreparation(api)

  const session = Schema.decodeUnknownSync(CalendarSession)({
    id: crypto.randomUUID(),
    generalChamberId: '50000000-0000-4000-8000-000000000001',
    name: 'Test session window',
    writtenAt: '2000-01-01T00:00:00.000Z',
    oralPlanningAt: '2000-01-02T00:00:00.000Z',
    selectionClosesAt: '2090-01-01T00:00:00.000Z',
  })

  await runFixture(
    Effect.gen(function* () {
      const examCalendarRepository = yield* ExamCalendarRepository
      yield* examCalendarRepository.create(session)
    }),
  )
  const submitted = { ...config, examSessionId: session.id }
  expect((await learningRequest(api, visitor, '/onboarding', submitted)).status).toBe(200)
  await runFixture(
    Effect.gen(function* () {
      const examCalendarRepository = yield* ExamCalendarRepository
      yield* examCalendarRepository.closeSelection(
        session.id,
        Schema.decodeSync(ApiDateTime)('2001-01-01T00:00:00.000Z'),
      )
    }),
  )
  expect((await learningRequest(api, visitor, `/paths/${pathId}/documents`)).status).toBe(200)
  expect(
    await (await learningRequest(api, visitor, '/onboarding', submitted)).json(),
  ).toMatchObject({ existing: true, archived: false })
  expect(
    await (await learningRequest(api, visitor, `/paths/${pathId}/goals`)).json(),
  ).toMatchObject({ data: [{ version: 1, examSessionId: session.id }] })
})
