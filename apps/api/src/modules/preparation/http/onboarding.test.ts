import { ExamSessionsResponse } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { PathLimitReached } from '@inzpro/api-contracts/modules/preparation/errors'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  GoalHistoryResponse,
  QualificationPathsResponse,
} from '@inzpro/api-contracts/modules/preparation/responses'
import {
  SpecializationsResponse,
  QualificationKindsResponse,
  QualificationScopesResponse,
} from '@inzpro/api-contracts/modules/qualification-paths/responses'
import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Cursor } from '@inzpro/domain/common/pagination'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import {
  unrestrictedQualificationScopeCode,
  restrictedQualificationScopeCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { demolitionSpecializationCode } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Effect, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { CalendarSession } from '~api/modules/exam-calendar/domain/exam-session.model.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { createStudyFixture, runFixture } from '~api/test/learning-fixtures.js'
import {
  loginForPreparation,
  learningRequest,
  technicalConfiguration,
  technicalPathA,
  technicalPathB,
} from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
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
    meta: { hasMore: true, nextCursor: expect.any(String) },
  })

  const second = await (
    await publicRequest(
      `/qualification-paths/specializations?limit=1&cursor=${encodeURIComponent(Schema.decodeUnknownSync(SpecializationsResponse)(first).meta.nextCursor ?? '')}`,
    )
  ).json()

  expect(second).toMatchObject({
    data: [{ id: '60000000-0000-4000-8000-000000000002' }],
    meta: { hasMore: true },
  })
  expect((await publicRequest('/qualification-paths/specializations?cursor=bad')).status).toBe(400)
  expect((await publicRequest('/qualification-paths/qualification-kinds')).status).toBe(400)
  expect(
    await (
      await publicRequest(
        `/qualification-paths/qualification-kinds?specializationId=${config.specializationId}`,
      )
    ).json(),
  ).toMatchObject({
    data: expect.arrayContaining([expect.objectContaining({ id: config.qualificationKindId })]),
    meta: { hasMore: false },
  })
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

  const replies = await Promise.all([
    request('/onboarding', config),
    request('/onboarding', config),
  ])

  expect(replies.map(reply => reply.status)).toEqual([200, 200])
  expect(await (await request('/paths')).json()).toMatchObject({
    data: [
      {
        id: pathId,
        goal: { version: 1 },
        accessScope: 'written',
        specialization: {
          description: null,
          code: 'konstrukcyjno-budowlana',
          id: config.specializationId,
          name: 'Konstrukcyjno-budowlana',
        },
        qualificationKind: {
          code: 'kierowanie',
          id: config.qualificationKindId,
          name: 'Kierowania robotami',
        },
        qualificationScope: {
          code: 'bez-ograniczen',
          id: config.qualificationScopeId,
          name: 'Bez ograniczeń',
        },
      },
    ],
  })
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
    { qualificationScopeId: '80000000-0000-4000-8000-000000000099' },
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
  const latestGoal = await (await request(`/paths/${pathId}/goals?limit=1`)).json()
  expect(latestGoal).toMatchObject({
    data: [{ version: 3, oralExamDate: change.oralExamDate }],
    meta: { hasMore: true, nextCursor: expect.any(String) },
  })
  expect(
    await (
      await request(
        `/paths/${pathId}/goals?limit=1&cursor=${encodeURIComponent(Schema.decodeUnknownSync(GoalHistoryResponse)(latestGoal).meta.nextCursor ?? '')}`,
      )
    ).json(),
  ).toMatchObject({ data: [{ version: 2 }], meta: { hasMore: true } })
  expect((await request(`/paths/${pathId}/documents`)).status).toBe(200)
})

test('archive and restore preserve assignments without a server-side selection', async () => {
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
  expect((await request('/selection')).status).toBe(404)
  expect((await request('/selection', { qualificationPathId: technicalPathB })).status).toBe(404)
  await request(`/paths/${technicalPathB}/archive`, {})
  expect(await (await request(`/paths/${technicalPathB}`)).json()).toMatchObject({
    path: { archived: true },
  })
  await request(`/paths/${pathId}/archive`, {})
  expect(await (await request('/onboarding', config)).json()).toMatchObject({
    existing: true,
    archived: true,
  })
  await request(`/paths/${pathId}/restore`, {})
  expect(await (await request(`/paths/${pathId}`)).json()).toMatchObject({
    path: { id: pathId, archived: false, goal: { version: 1 } },
  })
})

test('closing the selection window does not revoke access or break idempotent confirmation', async () => {
  const visitor = await loginForPreparation(api)

  const session = Schema.decodeSync(CalendarSession)({
    id: crypto.randomUUID(),
    generalChamberId: '50000000-0000-4000-8000-000000000001',
    name: 'Test session window',
    isConfirmed: true,
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
        yield* Schema.decodeEffect(DateTimeUtc)('2001-01-01T00:00:00.000Z'),
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

test('assignment pages follow assignment updates, reads preserve order and cursors isolate accounts', async () => {
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
  expect(await (await request('/paths?limit=1')).json()).toMatchObject({
    data: [{ id: technicalPathB }],
    meta: { hasMore: true },
  })

  expect((await request(`/paths/${pathId}/documents`)).status).toBe(200)
  expect(await (await request('/paths?limit=1')).json()).toMatchObject({
    data: [{ id: technicalPathB }],
  })
  expect((await request(`/paths/${pathId}/extend`, {})).status).toBe(200)

  const first = Schema.decodeUnknownSync(QualificationPathsResponse)(
    await (await request('/paths?limit=1')).json(),
  )

  expect(first).toMatchObject({ data: [{ id: pathId }], meta: { hasMore: true } })
  const cursor = encodeURIComponent(Schema.decodeUnknownSync(Cursor)(first.meta.nextCursor))
  expect(await (await request(`/paths?limit=1&cursor=${cursor}`)).json()).toMatchObject({
    data: [{ id: technicalPathB }],
    meta: { hasMore: false },
  })
  const other = await loginForPreparation(api)
  expect(
    await (await learningRequest(api, other, `/paths?limit=1&cursor=${cursor}`)).json(),
  ).toMatchObject({ data: [] })
  expect((await request('/paths?cursor=bad')).status).toBe(400)
  expect(
    (await request(`/paths?cursor=${encodeURIComponent('{"at":"invalid","id":"invalid"}')}`))
      .status,
  ).toBe(400)
})

test('the account lock enforces the configured cap, including concurrent onboarding and archived paths', async () => {
  const visitor = await loginForPreparation(api)
  const request = <Body>(path: string, body?: Body) => learningRequest(api, visitor, path, body)

  const fixtures = await Promise.all(
    Array.from({ length: maxUserQualificationPaths + 1 }, (_, index) =>
      createStudyFixture(`60000000-0000-4000-8000-${String(index + 4).padStart(12, '0')}`),
    ),
  )

  const configurations = fixtures.map(fixture =>
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  for (const configuration of configurations.slice(0, maxUserQualificationPaths - 1)) {
    expect((await request('/onboarding', configuration)).status).toBe(200)
  }

  const candidates = configurations.slice(maxUserQualificationPaths - 1)
  const replies = await Promise.all(candidates.map(payload => request('/onboarding', payload)))
  expect(replies.map(reply => reply.status).sort((left, right) => left - right)).toEqual([200, 409])

  const rejectedIndex = replies.findIndex(reply => reply.status === 409)
  const rejectedResponse = replies[rejectedIndex]
  const rejectedConfiguration = candidates[rejectedIndex]
  const firstConfiguration = configurations[0]
  const firstFixture = fixtures[0]

  if (
    rejectedResponse === undefined ||
    rejectedConfiguration === undefined ||
    firstConfiguration === undefined ||
    firstFixture === undefined
  ) {
    throw new Error('Missing path-limit fixture')
  }

  expect(Schema.decodeUnknownSync(PathLimitReached)(await rejectedResponse.json())).toBeInstanceOf(
    PathLimitReached,
  )

  const paths = Schema.decodeUnknownSync(Schema.toCodecJson(QualificationPathsResponse))(
    await (await request('/paths')).json(),
  )

  expect(paths.data).toHaveLength(maxUserQualificationPaths)
  expect(paths.meta.hasMore).toBe(false)
  expect(await (await request('/onboarding', firstConfiguration)).json()).toMatchObject({
    existing: true,
  })

  expect((await request(`/paths/${firstFixture.pathId}/archive`, {})).status).toBe(200)
  expect((await request('/onboarding', rejectedConfiguration)).status).toBe(409)
  expect((await request(`/paths/${firstFixture.pathId}/restore`, {})).status).toBe(200)

  const other = await loginForPreparation(api)
  expect((await learningRequest(api, other, '/onboarding', rejectedConfiguration)).status).toBe(200)
})

test('the full catalogue has stable codes, demolition restrictions and dated chamber sessions', async () => {
  const specializations = Schema.decodeUnknownSync(Schema.toCodecJson(SpecializationsResponse))(
    await (await publicRequest('/qualification-paths/specializations?limit=15')).json(),
  )

  expect(specializations.data).toHaveLength(11)
  expect(specializations.meta.hasMore).toBe(false)
  expect(specializations.data.filter(entry => entry.description !== null)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'Inżynieryjna kolejowa', description: 'obiekty budowlane' }),
      expect.objectContaining({ name: 'Inżynieryjna kolejowa', description: 'sterowanie ruchem' }),
    ]),
  )
  const scopeUrl = `/qualification-paths/qualification-scopes?specializationId=${config.specializationId}&qualificationKindId=${config.qualificationKindId}&limit=1`

  const restricted = Schema.decodeUnknownSync(Schema.toCodecJson(QualificationScopesResponse))(
    await (await publicRequest(scopeUrl)).json(),
  )

  expect(restricted.data[0]?.code).toBe(restrictedQualificationScopeCode)

  const unrestricted = Schema.decodeUnknownSync(Schema.toCodecJson(QualificationScopesResponse))(
    await (
      await publicRequest(
        `${scopeUrl}&cursor=${encodeURIComponent(restricted.meta.nextCursor ?? '')}`,
      )
    ).json(),
  )

  expect(unrestricted.data[0]?.code).toBe(unrestrictedQualificationScopeCode)

  const demolition = specializations.data.find(entry => entry.code === demolitionSpecializationCode)

  if (demolition === undefined) {
    throw new Error('Missing demolition specialization')
  }

  const kinds = Schema.decodeUnknownSync(Schema.toCodecJson(QualificationKindsResponse))(
    await (
      await publicRequest(
        `/qualification-paths/qualification-kinds?specializationId=${demolition.id}&limit=15`,
      )
    ).json(),
  )

  expect(kinds.data).toHaveLength(3)

  for (const kind of kinds.data) {
    const scopes = Schema.decodeUnknownSync(Schema.toCodecJson(QualificationScopesResponse))(
      await (
        await publicRequest(
          `/qualification-paths/qualification-scopes?specializationId=${demolition.id}&qualificationKindId=${kind.id}&limit=15`,
        )
      ).json(),
    )

    expect(scopes.data.map(scope => scope.code)).toEqual([unrestrictedQualificationScopeCode])
  }

  for (const specializationId of [
    config.specializationId,
    '60000000-0000-4000-8000-000000000002',
  ]) {
    const result = Schema.decodeUnknownSync(Schema.toCodecJson(ExamSessionsResponse))(
      await (
        await publicRequest(`/exam-calendar/sessions?specializationId=${specializationId}&limit=15`)
      ).json(),
    )

    const officialCatalogue = result.data.filter(session => session.name.startsWith('Sesja '))

    expect(officialCatalogue).toHaveLength(8)
    expect(officialCatalogue.map(session => session.writtenAt)).toEqual(
      officialCatalogue.map(session => session.writtenAt).toSorted(),
    )

    if (specializationId === config.specializationId) {
      expect(officialCatalogue.filter(session => !session.isConfirmed)).toHaveLength(3)
    } else {
      expect(officialCatalogue.every(session => session.isConfirmed)).toBe(true)
    }

    const nearest = Schema.decodeUnknownSync(Schema.toCodecJson(ExamSessionsResponse))(
      await (
        await publicRequest(`/exam-calendar/sessions?specializationId=${specializationId}&limit=2`)
      ).json(),
    )

    expect(nearest.data).toHaveLength(2)
    expect(nearest.data).toEqual(result.data.slice(0, 2))

    const first = Schema.decodeUnknownSync(Schema.toCodecJson(ExamSessionsResponse))(
      await (
        await publicRequest(`/exam-calendar/sessions?specializationId=${specializationId}&limit=1`)
      ).json(),
    )

    const next = Schema.decodeUnknownSync(Schema.toCodecJson(ExamSessionsResponse))(
      await (
        await publicRequest(
          `/exam-calendar/sessions?specializationId=${specializationId}&limit=1&cursor=${encodeURIComponent(first.meta.nextCursor ?? '')}`,
        )
      ).json(),
    )

    expect(next.data[0]?.id).not.toBe(first.data[0]?.id)
    expect((next.data[0]?.writtenAt ?? '') >= (first.data[0]?.writtenAt ?? '')).toBe(true)
  }
})
