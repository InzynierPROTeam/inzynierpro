import { DailyPlan } from '@inzpro/api-contracts/modules/daily-plan/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  DocumentQuestionPool,
  FavoritesPreview,
  SessionPreview,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { catalogueTestTime } from '~api/test/clock.js'
import { seededFixturePath } from '~api/test/preparation-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  technicalConfiguration,
  technicalDocumentA,
} from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

const nextDay = DateTime.add(catalogueTestTime, { days: 1 })

const examDay = DateTime.makeUnsafe('2026-11-20T12:00:00.000Z')

const dayAfterExam = DateTime.makeUnsafe('2026-11-21T12:00:00.000Z')

let today: TestApi
let tomorrow: TestApi
let onExamDay: TestApi
let afterExam: TestApi

beforeAll(async () => {
  ;[today, tomorrow, onExamDay, afterExam] = await Promise.all([
    startTestApi(),
    startTestApi({ now: nextDay }),
    startTestApi({ now: examDay }),
    startTestApi({ now: dayAfterExam }),
  ])
})

afterAll(() => Promise.all([today.close(), tomorrow.close(), onExamDay.close(), afterExam.close()]))

const sessionInAWeek = '90000000-0000-4000-8000-000000000015'

const sessionInMay = '90000000-0000-4000-8000-000000000001'

const combinedKind = '70000000-0000-4000-8000-000000000003'

const unrestrictedScope = '80000000-0000-4000-8000-000000000001'

const planSpecializations = {
  freezing: '60000000-0000-4000-8000-000000000007',
  counting: '60000000-0000-4000-8000-000000000008',
  round: '60000000-0000-4000-8000-000000000009',
  buffer: '60000000-0000-4000-8000-000000000010',
}

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) =>
    Schema.decodeUnknownSync(schema)(await response.json())

const learnerOnPath = async (specializationId: string, examSessionId = sessionInAWeek) => {
  const config = {
    ...technicalConfiguration,
    specializationId,
    qualificationKindId: combinedKind,
    qualificationScopeId: unrestrictedScope,
    accessScope: 'written',
    examSessionId,
  } satisfies typeof CompleteOnboardingPayload.Encoded

  const { pathId } = await seededFixturePath(config)
  const visitor = await loginForPreparation(today)

  await learningRequest(today, visitor, '/onboarding', config)

  const request = <Body>(path: string, body?: Body, api = today) =>
    learningRequest(api, visitor, `/paths/${pathId}${path}`, body)

  const plan = async (api = today) =>
    decode(DailyPlan)(
      await visitor.jar.fetch(new URL(`/api/v1/study/paths/${pathId}/daily-plan`, api.baseUrl)),
    )

  const pool = async () =>
    decode(Schema.Struct({ data: Schema.Array(DocumentQuestionPool) }))(
      await request('/documents?limit=100'),
    ).then(({ data }) =>
      data.reduce(
        (sum, document) => ({
          available: sum.available + document.availableQuestionCount,
          completed: sum.completed + document.completedQuestionCount,
        }),
        { available: 0, completed: 0 },
      ),
    )

  return { pathId, visitor, request, plan, pool }
}

type Learner = Awaited<ReturnType<typeof learnerOnPath>>

const startStudy = async ({ request }: Learner, api = today) => {
  const offered = await decode(SessionPreview)(
    await request(`/preview?documentId=${technicalDocumentA}`, undefined, api),
  )

  return decode(StudySession)(
    await request(
      '/sessions',
      {
        documentId: technicalDocumentA,
        questionCount: offered.availableQuestionCount,
        questionSelection: offered.questionSelection,
      },
      api,
    ),
  )
}

const answer = async ({ request }: Learner, sessionId: string, position: number, api = today) => {
  const shown = await decode(SessionQuestion)(
    await request(`/sessions/${sessionId}/questions/${position}`, undefined, api),
  )

  const response = await request(
    `/sessions/${sessionId}/questions/${position}/answer`,
    { questionRevisionId: shown.questionRevisionId, answerId: shown.answers[1]!.id },
    api,
  )

  expect(response.status).toBe(200)

  return shown
}

const coverPath = async (learner: Learner, api = today) => {
  const documents = await decode(Schema.Struct({ data: Schema.Array(DocumentQuestionPool) }))(
    await learner.request('/documents?limit=100', undefined, api),
  )

  for (const document of documents.data) {
    if (document.availableQuestionCount > document.completedQuestionCount) {
      const offered = await decode(SessionPreview)(
        await learner.request(`/preview?documentId=${document.id}`, undefined, api),
      )

      const session = await decode(StudySession)(
        await learner.request(
          '/sessions',
          {
            documentId: document.id,
            questionCount: offered.availableQuestionCount,
            questionSelection: offered.questionSelection,
          },
          api,
        ),
      )

      for (let position = 1; position <= session.progress.total; position++) {
        await answer(learner, session.id, position, api)
      }

      await learner.request(`/sessions/${session.id}/end`, {}, api)
    }
  }
}

const markFavorite = (visitor: TestVisitor, pathId: QualificationPathId, questionId: string) =>
  visitor.jar.fetch(
    new URL(`/api/v1/study/paths/${pathId}/favorites/${questionId}`, today.baseUrl),
    {
      method: 'PUT',
    },
  )

test('the plan keeps a week of buffer before a distant written exam', async () => {
  const learner = await learnerOnPath(planSpecializations.buffer, sessionInMay)
  const { available } = await learner.pool()

  expect(await learner.plan()).toEqual({
    status: 'planned',
    examDate: '2027-05-20T22:00:00.000Z',
    targetDate: '2027-05-13T22:00:00.000Z',
    daysUntilExam: 189,
    targetQuestionCount: Math.ceil(available / 183),
    completedQuestionCount: 0,
    questionsBehindPace: 0,
  })
})

test("today's target shrinks to the day before a close exam, stays frozen during the day and takes new material from the next day", async () => {
  const learner = await learnerOnPath(planSpecializations.freezing)
  const { available } = await learner.pool()
  const target = Math.ceil(available / 7)

  expect(await learner.plan()).toEqual({
    status: 'final_days',
    examDate: '2026-11-19T23:00:00.000Z',
    targetDate: '2026-11-18T23:00:00.000Z',
    daysUntilExam: 7,
    targetQuestionCount: target,
    completedQuestionCount: 0,
    questionsBehindPace: 0,
  })

  const session = await startStudy(learner)
  await answer(learner, session.id, 1)
  await answer(learner, session.id, 2)
  await addFixtureQuestion(learner.pathId, ReferenceDocumentId.make(technicalDocumentA))

  expect(await learner.plan()).toMatchObject({
    targetQuestionCount: target,
    completedQuestionCount: 2,
  })

  expect(await learner.plan(tomorrow)).toMatchObject({
    status: 'final_days',
    daysUntilExam: 6,
    targetQuestionCount: Math.ceil((available + 1 - 2) / 6),
    completedQuestionCount: 0,
  })
})

test('only regular-study answers that cover a question count, with surplus above the target', async () => {
  const learner = await learnerOnPath(planSpecializations.counting)
  const { available } = await learner.pool()
  const target = Math.ceil(available / 7)

  await learner.plan()

  const first = await startStudy(learner)

  for (let position = 1; position <= first.progress.total; position++) {
    await answer(learner, first.id, position)
  }

  await learner.request(`/sessions/${first.id}/end`, {})

  expect(await learner.plan()).toMatchObject({
    targetQuestionCount: target,
    completedQuestionCount: first.progress.total,
  })
  expect(first.progress.total).toBeGreaterThan(target)

  const shown = await decode(SessionQuestion)(
    await learner.request(`/sessions/${first.id}/questions/1`),
  )

  await markFavorite(learner.visitor, learner.pathId, shown.questionId)

  const favorites = await decode(FavoritesPreview)(await learner.request('/favorites-preview'))

  const favoritesSession = await decode(StudySession)(
    await learner.request('/favorites-sessions', {
      questionCount: favorites.settings?.defaultQuestionCount,
    }),
  )

  await answer(learner, favoritesSession.id, 1)

  const repeated = await startStudy(learner)
  await answer(learner, repeated.id, 1)

  expect(await learner.plan()).toMatchObject({
    targetQuestionCount: target,
    completedQuestionCount: first.progress.total,
  })
})

test('closing the round marks the day done and the next day plans the whole pool of the new round', async () => {
  const learner = await learnerOnPath(planSpecializations.round)
  const { available } = await learner.pool()

  await coverPath(learner)

  expect(await learner.plan()).toMatchObject({
    status: 'round_completed',
    targetQuestionCount: 0,
    completedQuestionCount: available,
  })

  expect(await learner.plan(tomorrow)).toMatchObject({
    status: 'final_days',
    targetQuestionCount: Math.ceil(available / 6),
    completedQuestionCount: 0,
    questionsBehindPace: 0,
  })
})

test('the exam day has no target and the next day asks for a new goal', async () => {
  const learner = await learnerOnPath(planSpecializations.round)

  expect(await learner.plan(onExamDay)).toMatchObject({
    status: 'final_days',
    daysUntilExam: 0,
    targetQuestionCount: 0,
    questionsBehindPace: 0,
  })

  expect(await learner.plan(afterExam)).toEqual({
    status: 'exam_passed',
    examDate: '2026-11-19T23:00:00.000Z',
  })
})

test('the plan of a learner without written access is refused', async () => {
  const visitor = await loginForPreparation(today)

  const config = {
    ...technicalConfiguration,
    specializationId: planSpecializations.buffer,
    qualificationKindId: combinedKind,
    qualificationScopeId: unrestrictedScope,
    accessScope: 'oral',
  } satisfies typeof CompleteOnboardingPayload.Encoded

  const { pathId } = await seededFixturePath(config)

  await learningRequest(today, visitor, '/onboarding', config)

  const response = await visitor.jar.fetch(
    new URL(`/api/v1/study/paths/${pathId}/daily-plan`, today.baseUrl),
  )

  expect(response.status).toBe(403)
})
