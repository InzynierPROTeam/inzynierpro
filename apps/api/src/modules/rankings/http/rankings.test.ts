import { LearningXpResponse } from '@inzpro/api-contracts/modules/learning-xp/responses'
import type { ChangeGoalPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  GoalOptionsResponse,
  PathMutationResponse,
} from '@inzpro/api-contracts/modules/preparation/responses'
import type {
  RenameProfilePayload,
  SetProfilePrivacyPayload,
} from '@inzpro/api-contracts/modules/profiles/requests'
import { ProfileSettings } from '@inzpro/api-contracts/modules/profiles/responses'
import { Ranking } from '@inzpro/api-contracts/modules/rankings/responses'
import type {
  StartSessionPayload,
  SubmitSessionAnswerPayload,
} from '@inzpro/api-contracts/modules/written-study/requests'
import {
  DocumentsResponse,
  SessionPreview,
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { rankingSize } from '@inzpro/domain/modules/rankings/ranking'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { awardFixtureXp, createFixtureExamSession } from '~api/test/learning-xp-fixtures.js'
import { seededFixturePath } from '~api/test/preparation-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  smallPathConfiguration,
} from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const get = (visitor: TestVisitor, path: string) =>
  visitor.jar.fetch(new URL(`/api/v1${path}`, api.baseUrl))

const put = (
  visitor: TestVisitor,
  path: string,
  body: typeof RenameProfilePayload.Encoded | typeof SetProfilePrivacyPayload.Encoded,
) =>
  visitor.jar.fetch(new URL(`/api/v1${path}`, api.baseUrl), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const periodRanking = async (visitor: TestVisitor, period: string) =>
  decode(Ranking)(await get(visitor, `/rankings/periods/${period}`))

const sessionRanking = async (visitor: TestVisitor, examSessionId: string) =>
  decode(Ranking)(await get(visitor, `/rankings/exam-sessions/${examSessionId}`))

const learner = async (name: string) => {
  const visitor = await loginForPreparation(api)

  await decode(ProfileSettings)(await put(visitor, '/profile/name', { name }))

  return { ...visitor, name, id: Schema.decodeSync(UserId)(visitor.userId) }
}

const learners = async (count: number) => {
  const signedIn: Array<Awaited<ReturnType<typeof learner>>> = []

  for (let start = 0; start < count; start += 10) {
    signedIn.push(
      ...(await Promise.all(
        Array.from({ length: Math.min(10, count - start) }, (_, index) =>
          learner(`Ranked learner ${start + index + 1}`),
        ),
      )),
    )
  }

  return signedIn
}

test('every period ranking totals the XP the ledger recorded in that period', async () => {
  const viewer = await learner('Period viewer')
  const examSessionId = await createFixtureExamSession()
  const otherExamSessionId = await createFixtureExamSession()

  await awardFixtureXp(
    [
      { amount: 30, awardedAt: '2026-11-10T10:00:00.000Z', examSessionId },
      { amount: 20, awardedAt: '2026-11-03T10:00:00.000Z', examSessionId },
      { amount: 7, awardedAt: '2026-11-08T22:59:59.000Z', examSessionId: otherExamSessionId },
      { amount: 10, awardedAt: '2026-10-20T10:00:00.000Z', examSessionId: otherExamSessionId },
    ].map(award => ({ userId: viewer.id, ...award })),
  )

  const viewerXp = async (period: string) => (await periodRanking(viewer, period)).viewer?.xp

  expect(await viewerXp('this_week')).toBe(30)
  expect(await viewerXp('last_week')).toBe(27)
  expect(await viewerXp('this_month')).toBe(57)
  expect(await viewerXp('last_month')).toBe(10)
  expect(await viewerXp('all_time')).toBe(
    (await decode(LearningXpResponse)(await get(viewer, '/learning-xp'))).total,
  )
  expect((await sessionRanking(viewer, examSessionId)).viewer?.xp).toBe(50)
  expect((await sessionRanking(viewer, otherExamSessionId)).viewer?.xp).toBe(17)
})

test('a learner without XP in the period has no own row', async () => {
  const viewer = await learner('Viewer without XP')

  expect((await periodRanking(viewer, 'this_week')).viewer).toBeNull()
  expect((await sessionRanking(viewer, await createFixtureExamSession())).viewer).toBeNull()
})

test('changing the goal keeps earlier XP in the session it was earned for', async () => {
  const visitor = await loginForPreparation(api)
  const { pathId } = await seededFixturePath(smallPathConfiguration)

  const request = (
    path: string,
    body?:
      | typeof StartSessionPayload.Encoded
      | typeof SubmitSessionAnswerPayload.Encoded
      | typeof ChangeGoalPayload.Encoded,
  ) => learningRequest(api, visitor, `/paths/${pathId}${path}`, body)

  await decode(PathMutationResponse)(
    await learningRequest(api, visitor, '/onboarding', smallPathConfiguration),
  )

  const { data: documents } = await decode(Schema.toCodecJson(DocumentsResponse))(
    await request('/documents?limit=100'),
  )

  const document = documents.find(({ availableQuestionCount }) => availableQuestionCount > 1)!

  const offered = await decode(SessionPreview)(await request(`/preview?documentId=${document.id}`))

  const session = await decode(StudySession)(
    await request('/sessions', {
      documentId: document.id,
      questionCount: offered.availableQuestionCount,
      questionSelection: offered.questionSelection,
    }),
  )

  const answer = async (position: number) => {
    const shown = await decode(SessionQuestion)(
      await request(`/sessions/${session.id}/questions/${position}`),
    )

    return decode(SubmitSessionAnswerResponse)(
      await request(`/sessions/${session.id}/questions/${position}/answer`, {
        questionRevisionId: shown.questionRevisionId,
        answerId: shown.answers[0]!.id,
      }),
    )
  }

  const before = await answer(1)

  const { data: goalOptions } = await decode(Schema.toCodecJson(GoalOptionsResponse))(
    await get(visitor, `/preparation/paths/${pathId}/goal-options?limit=100`),
  )

  const nextSession = goalOptions.find(({ id }) => id !== smallPathConfiguration.examSessionId)!

  await decode(PathMutationResponse)(
    await request('/goal', {
      examSessionId: nextSession.id,
      oralExamDate: null,
      expectedVersion: 1,
    }),
  )

  const after = await answer(2)

  expect(before.awardedXp).toBeGreaterThan(0)
  expect(after.awardedXp).toBeGreaterThan(0)
  expect((await sessionRanking(visitor, smallPathConfiguration.examSessionId)).viewer?.xp).toBe(
    before.awardedXp,
  )
  expect((await sessionRanking(visitor, nextSession.id)).viewer?.xp).toBe(after.awardedXp)
})

test('the ranking orders by XP, then by who reached the total first, and links only visible profiles', async () => {
  const examSessionId = await createFixtureExamSession()
  const [early, late, leader, hidden] = await learners(4)

  await awardFixtureXp(
    (
      [
        [late!, 40, '2026-11-12T10:00:00.000Z'],
        [early!, 40, '2026-11-11T10:00:00.000Z'],
        [leader!, 90, '2026-11-12T12:00:00.000Z'],
        [hidden!, 10, '2026-11-10T10:00:00.000Z'],
      ] as const
    ).map(([ranked, amount, awardedAt]) => ({
      userId: ranked.id,
      examSessionId,
      amount,
      awardedAt,
    })),
  )

  await decode(ProfileSettings)(await put(hidden!, '/profile/privacy', { privateProfile: true }))

  const ranking = await sessionRanking(early!, examSessionId)

  expect(
    ranking.entries.map(({ position, userId, name, xp, profileVisible }) => ({
      position,
      userId,
      name,
      xp,
      profileVisible,
    })),
  ).toEqual([
    { position: 1, userId: leader!.id, name: leader!.name, xp: 90, profileVisible: true },
    { position: 2, userId: early!.id, name: early!.name, xp: 40, profileVisible: true },
    { position: 3, userId: late!.id, name: late!.name, xp: 40, profileVisible: true },
    { position: 4, userId: hidden!.id, name: hidden!.name, xp: 10, profileVisible: false },
  ])
  expect(ranking.viewer).toEqual(ranking.entries[1])
  expect((await sessionRanking(hidden!, examSessionId)).viewer?.profileVisible).toBe(true)
})

test('the ranking lists the top learners and still shows the viewer outside them', async () => {
  const examSessionId = await createFixtureExamSession()
  const [viewer, ...others] = await learners(rankingSize + 1)

  await awardFixtureXp(
    [
      ...others.map((ranked, index) => ({ ranked, amount: 100 + index })),
      { ranked: viewer!, amount: 1 },
    ].map(({ ranked, amount }) => ({
      userId: ranked.id,
      examSessionId,
      amount,
      awardedAt: '2026-11-12T10:00:00.000Z',
    })),
  )

  const ranking = await sessionRanking(viewer!, examSessionId)

  expect(ranking.entries).toHaveLength(rankingSize)
  expect(ranking.entries.map(({ position }) => position)).toEqual(
    Array.from({ length: rankingSize }, (_, index) => index + 1),
  )
  expect(ranking.entries.some(({ userId }) => userId === viewer!.id)).toBe(false)
  expect(ranking.viewer).toMatchObject({
    position: rankingSize + 1,
    userId: viewer!.id,
    xp: 1,
    profileVisible: true,
  })
})

test('rankings require a signed-in user and a known period', async () => {
  const visitor = await loginForPreparation(api)

  expect((await get(api.visitor(), '/rankings/periods/this_week')).status).toBe(401)
  expect((await get(visitor, '/rankings/periods/next_week')).status).toBe(400)
  expect((await get(visitor, '/rankings/exam-sessions/not-a-session')).status).toBe(400)
})
