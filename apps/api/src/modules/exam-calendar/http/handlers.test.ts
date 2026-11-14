import { ExamSessionsResponse } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { GoalOptionsResponse } from '@inzpro/api-contracts/modules/preparation/responses'
import { DateTime, Effect, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { CalendarSession } from '~api/modules/exam-calendar/domain/exam-session.model.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { runFixture } from '~api/test/learning-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  technicalConfiguration,
  technicalPathA,
} from '~api/test/preparation.js'

const now = DateTime.makeUnsafe('2090-01-01T12:00:00.000Z')

const cases = [
  { name: 'before the deadline', offset: 1, available: true },
  { name: 'exactly at the deadline', offset: 0, available: false },
  { name: 'after the deadline', offset: -1, available: false },
].map(entry => ({
  ...entry,
  session: Schema.decodeSync(CalendarSession)({
    id: crypto.randomUUID(),
    generalChamberId: '50000000-0000-4000-8000-000000000001',
    name: `Clock boundary: ${entry.name}`,
    writtenAt: '2089-12-01T00:00:00.000Z',
    oralPlanningAt: '2089-12-15T00:00:00.000Z',
    selectionClosesAt: DateTime.formatIso(DateTime.add(now, { milliseconds: entry.offset })),
    isConfirmed: true,
  }),
}))

let api: TestApi

beforeAll(async () => {
  await runFixture(
    Effect.gen(function* () {
      const examCalendarRepository = yield* ExamCalendarRepository

      for (const entry of cases) {
        yield* examCalendarRepository.create(entry.session)
      }
    }),
  )
  api = await startTestApi({ now })
})

afterAll(() => api.close())

test('public and personal session lists use the injected clock with an exclusive deadline', async () => {
  const visitor = await loginForPreparation(api)

  const publicResponse = await api
    .visitor()
    .jar.fetch(
      new URL(
        `/api/v1/exam-calendar/sessions?specializationId=${technicalConfiguration.specializationId}`,
        api.baseUrl,
      ),
    )

  expect(publicResponse.status).toBe(200)

  const publicPage = Schema.decodeUnknownSync(Schema.toCodecJson(ExamSessionsResponse))(
    await publicResponse.json(),
  )

  expect(publicPage.data.map(session => session.id)).toEqual(
    cases.flatMap(entry => (entry.available ? [entry.session.id] : [])),
  )

  const available = cases.find(entry => entry.available)

  if (available === undefined) {
    throw new Error('Missing open session fixture')
  }

  expect(
    (
      await learningRequest(api, visitor, '/onboarding', {
        ...technicalConfiguration,
        examSessionId: available.session.id,
      })
    ).status,
  ).toBe(200)

  const personalResponse = await learningRequest(
    api,
    visitor,
    `/paths/${technicalPathA}/goal-options`,
  )

  expect(personalResponse.status).toBe(200)

  const personalPage = Schema.decodeUnknownSync(Schema.toCodecJson(GoalOptionsResponse))(
    await personalResponse.json(),
  )

  expect(personalPage.data).toEqual(publicPage.data)
})

test.each(cases)('onboarding validates eligibility $name using the same clock', async entry => {
  const visitor = await loginForPreparation(api)

  const response = await learningRequest(api, visitor, '/onboarding', {
    ...technicalConfiguration,
    examSessionId: entry.session.id,
  })

  expect(response.status).toBe(entry.available ? 200 : 400)
})
