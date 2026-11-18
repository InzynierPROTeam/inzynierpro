import type { ChangeDailyPlanSettingsPayload } from '@inzpro/api-contracts/modules/daily-plan/requests'
import { DailyPlan } from '@inzpro/api-contracts/modules/daily-plan/responses'
import {
  OralMaterialsResponse,
  OralSessionPreview,
  OralSessionQuestion,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import type { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { maximumPageLimit } from '@inzpro/domain/common/pagination'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { seededFixturePath } from '~api/test/preparation-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  technicalConfiguration,
} from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const oralPlanConfiguration = {
  ...technicalConfiguration,
  specializationId: '60000000-0000-4000-8000-000000000011',
  qualificationKindId: '70000000-0000-4000-8000-000000000003',
  qualificationScopeId: '80000000-0000-4000-8000-000000000001',
  accessScope: 'oral',
  examSessionId: '90000000-0000-4000-8000-000000000015',
} satisfies typeof CompleteOnboardingPayload.Encoded

const defaultSettings = { version: 1, preference: { mode: 'default' } }

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const learnerOnPath = async (config: typeof CompleteOnboardingPayload.Encoded) => {
  const visitor = await loginForPreparation(api)
  const { pathId } = await seededFixturePath(config)

  await learningRequest(api, visitor, '/onboarding', config)

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${pathId}/oral${path}`, body)

  const plan = async () => decode(DailyPlan)(await request('/daily-plan'))

  const categories = async () =>
    Schema.decodeUnknownSync(Schema.toCodecJson(OralMaterialsResponse))(
      await (await request(`?limit=${maximumPageLimit}`)).json(),
    ).data

  const pool = async () =>
    (await categories()).reduce((sum, category) => sum + category.availableQuestionCount, 0)

  const changeSettings = (body: typeof ChangeDailyPlanSettingsPayload.Encoded) =>
    visitor.jar.fetch(
      new URL(`/api/v1/study/paths/${pathId}/oral/daily-plan/settings`, api.baseUrl),
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

  return { request, plan, categories, pool, changeSettings }
}

test('the oral plan targets a week before the oral planning date when the goal has no oral date', async () => {
  const learner = await learnerOnPath(oralPlanConfiguration)
  const available = await learner.pool()

  expect(await learner.plan()).toEqual({
    status: 'planned',
    examDate: '2026-12-03T23:00:00.000Z',
    targetDate: '2026-11-26T23:00:00.000Z',
    daysUntilExam: 21,
    targetQuestionCount: Math.ceil(available / 15),
    completedQuestionCount: 0,
    questionsBehindPace: 0,
    settings: defaultSettings,
  })
})

test("the oral plan follows the learner's own oral exam date", async () => {
  const learner = await learnerOnPath({
    ...oralPlanConfiguration,
    oralExamDate: '2026-11-25T09:00:00.000Z',
  })

  const available = await learner.pool()

  expect(await learner.plan()).toMatchObject({
    status: 'planned',
    examDate: '2026-11-24T23:00:00.000Z',
    targetDate: '2026-11-17T23:00:00.000Z',
    daysUntilExam: 12,
    targetQuestionCount: Math.ceil(available / 6),
  })
})

test('oral self-assessments in regular study count towards the oral target', async () => {
  const learner = await learnerOnPath(oralPlanConfiguration)
  const [category] = await learner.categories()

  const offered = await decode(Schema.NullOr(OralSessionPreview))(
    await learner.request(`/preview?categoryId=${category!.id}`),
  )

  const session = await decode(OralStudySession)(
    await learner.request('/sessions', {
      categoryId: category!.id,
      questionCount: offered?.settings.defaultQuestionCount,
    }),
  )

  const shown = await decode(OralSessionQuestion)(
    await learner.request(`/sessions/${session.id}/questions/1`),
  )

  await decode(Schema.Unknown)(
    await learner.request(`/sessions/${session.id}/questions/1/self-assessment`, {
      oralRevisionId: shown.oralRevisionId,
      selfAssessment: 'medium',
    }),
  )

  expect(await learner.plan()).toMatchObject({ completedQuestionCount: 1 })
})

test('a path without oral material has a distinct state', async () => {
  const learner = await learnerOnPath({ ...technicalConfiguration, accessScope: 'oral' })

  expect(await learner.plan()).toEqual({
    status: 'no_material',
    settings: defaultSettings,
  })
})

test('the oral plan takes a fixed daily count and refuses a stale settings version', async () => {
  const learner = await learnerOnPath(oralPlanConfiguration)

  await learner.plan()

  expect(
    await decode(DailyPlan)(
      await learner.changeSettings({
        preference: { mode: 'daily_count', dailyQuestionCount: 2 },
        expectedVersion: 1,
      }),
    ),
  ).toMatchObject({
    targetQuestionCount: 2,
    settings: { version: 2, preference: { mode: 'daily_count', dailyQuestionCount: 2 } },
  })

  const stale = await learner.changeSettings({
    preference: { mode: 'default' },
    expectedVersion: 1,
  })

  expect(stale.status).toBe(409)
})
