import {
  OralReviewPreview,
  OralStudySession,
  OralSessionQuestion,
  OralMaterialsResponse,
  OralSessionNextStepResponse,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { databaseLayerFromConfig } from '@inzpro/db'
import { DateTime, Effect, Layer, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { cosmeticChange } from '~api/modules/learning-content/domain/learning-content.model.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { submitOralSelfAssessment } from '~api/modules/oral-study/application/submit-oral-self-assessment.command.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-study.repository.postgres.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { fixedWallClockLayer, catalogueTestTime } from '~api/test/clock.js'
import {
  addFixtureOralCategory,
  addFixtureOralQuestion,
  publishFixtureOralRevision,
  withdrawFixtureOralRevision,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

const commandLayer = Layer.mergeAll(
  PreparationReaderLive,
  PreparationRepositoryLive,
  OralStudyReaderLive,
  OralStudyRepositoryLive,
  ReviewSchedulerLive,
).pipe(Layer.provide(databaseLayerFromConfig))

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('an empty oral review queue has no settings or unfinished session and refuses creation', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )
  const base = `/paths/${fixture.pathId}/oral`
  const preview = await learningRequest(api, visitor, `${base}/review-preview`)
  expect(preview.status).toBe(200)
  expect(await preview.json()).toMatchObject({
    dueQuestionCount: 0,
    nextDueAt: null,
    settings: null,
    category: null,
  })
  const start = await learningRequest(api, visitor, `${base}/review-sessions`, { questionCount: 1 })
  expect(start.status).toBe(409)
  const session = await learningRequest(api, visitor, `${base}/review-session`)
  expect(session.status).toBe(200)
  expect(await session.json()).toBeNull()
})

test('oral reviews select only due questions most overdue first, constrain scope and counts, and resume per scope', async () => {
  const learner = await reviewLearner()
  const categoryId = await addFixtureOralCategory()
  const otherCategoryId = await addFixtureOralCategory()
  const questions = []

  for (let i = 0; i < 12; i++) {
    questions.push(await addFixtureOralQuestion(learner.pathId, categoryId, i + 1))
  }

  const other = await addFixtureOralQuestion(learner.pathId, otherCategoryId, 1)
  await learner.study(categoryId, 12, '2026-11-10T12:00:00.000Z')
  await learner.study(otherCategoryId, 1, '2026-11-11T12:00:00.000Z')
  const preview = await learner.read(OralReviewPreview, '/review-preview')
  expect(preview).toMatchObject({
    dueQuestionCount: 13,
    category: null,
    settings: { defaultQuestionCount: 10, minimumQuestionCount: 1, maximumQuestionCount: 13 },
  })

  const scoped = await learner.read(
    OralReviewPreview,
    `/review-preview?categoryId=${otherCategoryId}`,
  )

  expect(scoped).toMatchObject({
    dueQuestionCount: 1,
    category: { id: otherCategoryId },
    settings: { defaultQuestionCount: 1 },
  })
  expect((await learner.request('/review-sessions', { questionCount: 14 })).status).toBe(409)
  const global = await learner.read(OralStudySession, '/review-sessions', { questionCount: 13 })
  expect(global).toMatchObject({ kind: 'review', category: null, progress: { total: 13 } })
  const selected = []

  for (let position = 1; position <= 13; position++) {
    selected.push(
      (await learner.read(OralSessionQuestion, `/sessions/${global.id}/questions/${position}`))
        .questionId,
    )
  }

  expect(selected.slice(0, 12).sort()).toEqual(questions.map(q => q.id).sort())
  expect(selected[12]).toBe(other.id)
  expect((await learner.request('/review-sessions', { questionCount: 1 })).status).toBe(409)

  const category = await learner.read(OralStudySession, '/review-sessions', {
    categoryId: otherCategoryId,
    questionCount: 1,
  })

  expect(
    (await learner.read(OralSessionQuestion, `/sessions/${category.id}/questions/1`)).questionId,
  ).toBe(other.id)
  expect(
    await learner.read(OralStudySession, `/review-session?categoryId=${otherCategoryId}`),
  ).toMatchObject({ id: category.id })
  expect(await learner.read(OralStudySession, '/review-session')).toMatchObject({ id: global.id })
})

test('review self-assessments reschedule oral SRS without moving oral coverage and offer regular study afterwards', async () => {
  const learner = await reviewLearner('60000000-0000-4000-8000-000000000010')
  const categoryId = await addFixtureOralCategory()
  await addFixtureOralQuestion(learner.pathId, categoryId, 1)
  await learner.study(categoryId, 1, '2026-11-10T12:00:00.000Z')
  const categories = await learner.read(Schema.toCodecJson(OralMaterialsResponse), '?limit=100')

  for (const category of categories.data) {
    if (category.id !== categoryId) {
      await learner.study(category.id, category.availableQuestionCount, '2026-11-10T12:00:00.000Z')
    }
  }

  const before = await learner.read(Schema.toCodecJson(OralMaterialsResponse), '?limit=100')
  expect(before.data.every(category => category.completedQuestionCount === 0)).toBe(true)
  const offered = await learner.read(OralReviewPreview, '/review-preview')

  const review = await learner.read(OralStudySession, '/review-sessions', {
    questionCount: offered.dueQuestionCount,
  })

  for (let position = 1; position <= review.progress.total; position++) {
    const shown = await learner.read(
      OralSessionQuestion,
      `/sessions/${review.id}/questions/${position}`,
    )

    const assessment = { oralRevisionId: shown.oralRevisionId, selfAssessment: 'hard' }
    expect(
      (
        await learner.request(
          `/sessions/${review.id}/questions/${position}/self-assessment`,
          assessment,
        )
      ).status,
    ).toBe(200)

    if (position === 1) {
      expect(
        (
          await learner.request(
            `/sessions/${review.id}/questions/${position}/self-assessment`,
            assessment,
          )
        ).status,
      ).toBe(200)
    }
  }

  const after = await learner.read(Schema.toCodecJson(OralMaterialsResponse), '?limit=100')
  expect(after.data).toEqual(before.data)
  await learner.request(`/sessions/${review.id}/end`, {})
  expect(
    await learner.read(OralSessionNextStepResponse, `/sessions/${review.id}/next-step`),
  ).toMatchObject({ type: 'start-study' })
  const preview = await learner.read(OralReviewPreview, '/review-preview')
  expect(preview).toMatchObject({ dueQuestionCount: 0, settings: null })
  expect(preview.nextDueAt).not.toBeNull()
  expect(DateTime.toEpochMillis(DateTime.makeUnsafe(preview.nextDueAt!))).toBeGreaterThan(
    DateTime.toEpochMillis(catalogueTestTime),
  )
})

const reviewLearner = async (specializationId = studySessionSpecialization) => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(specializationId)
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const requestAt = <Body>(timedApi: TestApi, path: string, body?: Body) =>
    learningRequest(timedApi, visitor, `/paths/${fixture.pathId}/oral${path}`, body)

  const request = <Body>(path: string, body?: Body) => requestAt(api, path, body)

  const read = async <S extends Schema.Decoder<unknown>, Body>(
    schema: S,
    path: string,
    body?: Body,
  ): Promise<S['Type']> => {
    const response = await request(path, body)
    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

  const study = async (categoryId: string, count: number, at: string) => {
    const session = await read(OralStudySession, '/sessions', { categoryId, questionCount: count })

    for (let position = 1; position <= count; position++) {
      const shown = await read(OralSessionQuestion, `/sessions/${session.id}/questions/${position}`)
      await Effect.runPromise(
        submitOralSelfAssessment(
          visitor.userId,
          fixture.pathId,
          session.id,
          shown.position,
          shown.oralRevisionId,
          'hard',
        ).pipe(
          Effect.provide(Layer.merge(commandLayer, fixedWallClockLayer(DateTime.makeUnsafe(at)))),
          Effect.scoped,
        ),
      )
    }

    await request(`/sessions/${session.id}/end`, {})
  }

  return { request, requestAt, read, study, pathId: fixture.pathId, userId: visitor.userId }
}

test('review selection excludes withdrawn and replaced substantive content, pins current cosmetic revisions and never pads with future questions', async () => {
  const learner = await reviewLearner()
  const categoryId = await addFixtureOralCategory()
  const current = await addFixtureOralQuestion(learner.pathId, categoryId, 1)
  const withdrawn = await addFixtureOralQuestion(learner.pathId, categoryId, 2)
  const replaced = await addFixtureOralQuestion(learner.pathId, categoryId, 3)
  const futureCategory = await addFixtureOralCategory()
  await addFixtureOralQuestion(learner.pathId, futureCategory, 1)
  await learner.study(categoryId, 3, '2026-11-10T12:00:00.000Z')
  await learner.study(futureCategory, 1, '2026-11-13T12:00:00.000Z')
  const cosmetic = await publishFixtureOralRevision(current.id, cosmeticChange)
  await publishFixtureOralRevision(replaced.id)
  await withdrawFixtureOralRevision(withdrawn.revisionId)
  expect(await learner.read(OralReviewPreview, '/review-preview')).toMatchObject({
    dueQuestionCount: 1,
    settings: { defaultQuestionCount: 1, maximumQuestionCount: 1 },
  })
  const session = await learner.read(OralStudySession, '/review-sessions', { questionCount: 1 })
  expect(
    await learner.read(OralSessionQuestion, `/sessions/${session.id}/questions/1`),
  ).toMatchObject({ questionId: current.id, oralRevisionId: cosmetic.revisionId })
  await withdrawFixtureOralRevision(cosmetic.revisionId)

  const assessment = await learner.request(`/sessions/${session.id}/questions/1/self-assessment`, {
    oralRevisionId: cosmetic.revisionId,
    selfAssessment: 'easy',
  })

  expect(assessment.status).toBe(409)
  await learner.request(`/sessions/${session.id}/end`, {})
  expect(await learner.read(OralStudySession, `/sessions/${session.id}`)).toMatchObject({
    progress: { skipped: 1 },
  })
})

test('a review summary offers remaining due questions in its category before the whole path', async () => {
  const learner = await reviewLearner()
  const categoryId = await addFixtureOralCategory()
  await addFixtureOralQuestion(learner.pathId, categoryId, 1)
  await addFixtureOralQuestion(learner.pathId, categoryId, 2)
  await learner.study(categoryId, 2, '2026-11-10T12:00:00.000Z')

  const session = await learner.read(OralStudySession, '/review-sessions', {
    categoryId,
    questionCount: 1,
  })

  await learner.request(`/sessions/${session.id}/end`, {})
  expect(
    await learner.read(OralSessionNextStepResponse, `/sessions/${session.id}/next-step`),
  ).toMatchObject({ type: 'review', category: { id: categoryId }, dueQuestionCount: 2 })
})

test('a finished review continues from the latest regular-study category rather than its review scope', async () => {
  const learner = await reviewLearner()
  const reviewCategory = '32000000-0000-4000-8000-000000000003'
  const regularCategory = '32000000-0000-4000-8000-000000000002'
  await learner.study(reviewCategory, 4, '2026-11-10T12:00:00.000Z')

  const regular = await learner.read(OralStudySession, '/sessions', {
    categoryId: regularCategory,
    questionCount: 4,
  })

  await learner.request(`/sessions/${regular.id}/end`, {})

  const review = await learner.read(OralStudySession, '/review-sessions', {
    categoryId: reviewCategory,
    questionCount: 4,
  })

  for (let position = 1; position <= 4; position++) {
    const question = await learner.read(
      OralSessionQuestion,
      `/sessions/${review.id}/questions/${position}`,
    )

    expect(
      (
        await learner.request(`/sessions/${review.id}/questions/${position}/self-assessment`, {
          oralRevisionId: question.oralRevisionId,
          selfAssessment: 'easy',
        })
      ).status,
    ).toBe(200)
  }

  await learner.request(`/sessions/${review.id}/end`, {})
  expect(
    await learner.read(OralSessionNextStepResponse, `/sessions/${review.id}/next-step`),
  ).toMatchObject({ type: 'start-study', preview: { category: { id: regularCategory } } })
})

test('oral reviews defer assessed questions until Warsaw midnight, including a later success in an overlapping session', async () => {
  const learner = await reviewLearner()
  const categoryId = await addFixtureOralCategory()
  await addFixtureOralQuestion(learner.pathId, categoryId, 1)
  await learner.study(categoryId, 1, '2026-11-12T12:00:00.000Z')
  const global = await learner.read(OralStudySession, '/review-sessions', { questionCount: 1 })

  const scoped = await learner.read(OralStudySession, '/review-sessions', {
    categoryId,
    questionCount: 1,
  })

  const shown = await learner.read(OralSessionQuestion, `/sessions/${global.id}/questions/1`)
  expect(
    (
      await learner.request(`/sessions/${global.id}/questions/1/self-assessment`, {
        oralRevisionId: shown.oralRevisionId,
        selfAssessment: 'hard',
      })
    ).status,
  ).toBe(200)
  await learner.request(`/sessions/${global.id}/end`, {})
  const later = await startTestApi({ now: DateTime.makeUnsafe('2026-11-13T12:10:00.000Z') })
  const tomorrow = await startTestApi({ now: DateTime.makeUnsafe('2026-11-13T23:00:00.000Z') })

  try {
    expect(
      (
        await learner.requestAt(later, `/sessions/${scoped.id}/questions/1/self-assessment`, {
          oralRevisionId: shown.oralRevisionId,
          selfAssessment: 'easy',
        })
      ).status,
    ).toBe(200)
    await learner.requestAt(later, `/sessions/${scoped.id}/end`, {})

    for (const query of ['', `?categoryId=${categoryId}`]) {
      const response = await learner.requestAt(later, `/review-preview${query}`)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        dueQuestionCount: 0,
        settings: null,
        nextDueAt: '2026-11-13T23:00:00.000Z',
      })
    }

    expect((await learner.requestAt(later, '/review-sessions', { questionCount: 1 })).status).toBe(
      409,
    )
    const due = await learner.requestAt(tomorrow, '/review-preview')
    expect(await due.json()).toMatchObject({
      dueQuestionCount: 1,
      settings: { defaultQuestionCount: 1 },
    })
    expect(
      (await learner.requestAt(tomorrow, '/review-sessions', { questionCount: 1 })).status,
    ).toBe(200)
  } finally {
    await later.close()
    await tomorrow.close()
  }
})
