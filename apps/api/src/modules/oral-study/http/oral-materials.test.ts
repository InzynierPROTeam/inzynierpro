import {
  OralMaterialsResponse,
  type OralQuestionCategory,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { maximumPageLimit } from '@inzpro/domain/common/pagination'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureOralCategory,
  addFixtureOralQuestion,
  assignFixtureOralQuestion,
  publishFixtureOralRevision,
  withdrawFixtureOralRevision,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const learnerOnPath = async (
  specializationId?: string,
  accessScope: typeof CompleteOnboardingPayload.Encoded.accessScope = 'both',
) => {
  const visitor = await loginForPreparation(api)
  const { pathId, config } = await createStudyFixture(specializationId)

  await learningRequest(api, visitor, '/onboarding', {
    ...Schema.encodeSync(CompleteOnboardingPayload)(config),
    accessScope,
  })

  const request = (path: string) => learningRequest(api, visitor, path)

  const page = async (query: string) => {
    const response = await request(`/paths/${pathId}/oral?${query}`)
    expect(response.status).toBe(200)

    const { data, meta } = Schema.decodeUnknownSync(Schema.toCodecJson(OralMaterialsResponse))(
      await response.json(),
    )

    return { data, hasMore: meta.hasMore, nextCursor: meta.nextCursor ?? '' }
  }

  const categories = async () => {
    const found: Array<OralQuestionCategory> = []
    let cursor = ''
    let hasMore = true

    while (hasMore) {
      const next = await page(
        `limit=${maximumPageLimit}${cursor === '' ? '' : `&cursor=${encodeURIComponent(cursor)}`}`,
      )

      found.push(...next.data)
      cursor = next.nextCursor
      hasMore = next.hasMore
    }

    return found
  }

  return { pathId, request, page, categories }
}

const categoryOf = (categories: ReadonlyArray<OralQuestionCategory>, id: OralQuestionCategoryId) =>
  categories.find(category => category.id === id)

test('oral categories count the published, current questions assigned to the path', async () => {
  const learner = await learnerOnPath()
  const other = await learnerOnPath(studySessionSpecialization)
  const shared = await addFixtureOralCategory('Prawo budowlane w praktyce')
  const elsewhere = await addFixtureOralCategory('Kategoria innej ścieżki')

  await addFixtureOralQuestion(learner.pathId, shared, 1)
  await addFixtureOralQuestion(learner.pathId, shared, 2)
  await addFixtureOralQuestion(learner.pathId, shared, 3, false)
  const withdrawn = await addFixtureOralQuestion(learner.pathId, shared, 4)
  await withdrawFixtureOralRevision(withdrawn.revisionId)
  const assignedLater = await addFixtureOralQuestion(other.pathId, shared, 5)
  await assignFixtureOralQuestion(learner.pathId, assignedLater.id)
  await addFixtureOralQuestion(other.pathId, elsewhere, 1)

  const categories = await learner.categories()

  expect(categoryOf(categories, shared)).toEqual({
    id: shared,
    name: 'Prawo budowlane w praktyce',
    availableQuestionCount: 3,
    completedQuestionCount: 0,
  })
  expect(categoryOf(categories, elsewhere)).toBeUndefined()
  expect(categoryOf(await other.categories(), shared)?.availableQuestionCount).toBe(1)
})

test('a newer revision replaces the withdrawn one in the category count', async () => {
  const learner = await learnerOnPath()
  const category = await addFixtureOralCategory()
  const question = await addFixtureOralQuestion(learner.pathId, category, 1)

  await withdrawFixtureOralRevision(question.revisionId)
  expect(categoryOf(await learner.categories(), category)).toBeUndefined()

  await publishFixtureOralRevision(question.id)
  expect(categoryOf(await learner.categories(), category)?.availableQuestionCount).toBe(1)
})

test('oral categories follow the catalogue order across cursor pages', async () => {
  const learner = await learnerOnPath()
  const later = await addFixtureOralCategory('Później', 2_000_000)
  const earlier = await addFixtureOralCategory('Wcześniej', 1_000_000)
  await addFixtureOralQuestion(learner.pathId, later, 1)
  await addFixtureOralQuestion(learner.pathId, earlier, 1)

  const ids = (await learner.categories()).map(category => category.id)

  expect(ids.indexOf(earlier)).toBeGreaterThanOrEqual(0)
  expect(ids.indexOf(earlier)).toBeLessThan(ids.indexOf(later))

  const firstPage = await learner.page('limit=1')

  const secondPage = await learner.page(
    `limit=1&cursor=${encodeURIComponent(firstPage.nextCursor)}`,
  )

  expect(firstPage.hasMore).toBe(true)
  expect(secondPage.data[0]?.id).toBe(ids[1])
})

test('learners with only written access cannot read oral categories', async () => {
  const learner = await learnerOnPath(undefined, 'written')

  expect((await learner.request(`/paths/${learner.pathId}/oral`)).status).toBe(403)
})
