import {
  OralReviewPreview,
  OralSessionPreview,
  OralSessionQuestion,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { databaseLayerFromConfig } from '@inzpro/db'
import { DateTime, Effect, Layer, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { TransactionLive } from '~api/lib/transaction.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { submitOralSelfAssessment } from '~api/modules/oral-study/application/submit-oral-self-assessment.command.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-study.repository.postgres.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { fixedWallClockLayer } from '~api/test/clock.js'
import {
  addFixtureOralCategory,
  addFixtureOralQuestion,
  linkFixtureOralQuestionToChamber,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

const mazowieckaEngineers = '51000000-0000-4000-8000-000000000007'

const opolskaEngineers = '51000000-0000-4000-8000-000000000008'

const pomorskaEngineers = '51000000-0000-4000-8000-000000000011'

const firstSeededCategory = '32000000-0000-4000-8000-000000000001'

const reportedInMyChamber = 'questionScope=reported_in_my_chamber'

const commandLayer = Layer.mergeAll(
  TransactionLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  OralStudyReaderLive,
  OralStudyRepositoryLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
).pipe(Layer.provide(databaseLayerFromConfig))

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const chamberLearner = async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}/oral${path}`, body)

  const read = async <S extends Schema.Decoder<unknown>, Body>(
    schema: S,
    path: string,
    body?: Body,
  ): Promise<S['Type']> => {
    const response = await request(path, body)
    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

  const chooseChamber = async (districtChamberId: string | null) =>
    expect(
      (
        await learningRequest(api, visitor, `/paths/${fixture.pathId}/district-chamber`, {
          districtChamberId,
        })
      ).status,
    ).toBe(200)

  const sessionQuestionIds = async (session: OralStudySession) => {
    const ids = []

    for (let position = 1; position <= session.progress.total; position++) {
      ids.push(
        (await read(OralSessionQuestion, `/sessions/${session.id}/questions/${position}`))
          .questionId,
      )
    }

    return ids.toSorted()
  }

  const assessAt = async (session: OralStudySession, at: string) => {
    for (let position = 1; position <= session.progress.total; position++) {
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

  return { pathId: fixture.pathId, request, read, chooseChamber, sessionQuestionIds, assessAt }
}

const reportedCategory = async (pathId: Parameters<typeof addFixtureOralQuestion>[0]) => {
  const categoryId = await addFixtureOralCategory()
  const first = await addFixtureOralQuestion(pathId, categoryId, 1)
  const unreported = await addFixtureOralQuestion(pathId, categoryId, 2)
  const third = await addFixtureOralQuestion(pathId, categoryId, 3)
  await linkFixtureOralQuestionToChamber(first.id, opolskaEngineers, 'recollection')
  await linkFixtureOralQuestionToChamber(first.id, opolskaEngineers, 'official')
  await linkFixtureOralQuestionToChamber(third.id, opolskaEngineers)
  await linkFixtureOralQuestionToChamber(unreported.id, pomorskaEngineers)

  return { categoryId, reported: [first.id, third.id].toSorted(), unreported: unreported.id }
}

test('reported in my chamber without a chosen chamber is refused while the whole path stays available', async () => {
  const learner = await chamberLearner()
  const { categoryId } = await reportedCategory(learner.pathId)

  for (const response of [
    await learner.request(`/preview?categoryId=${categoryId}&${reportedInMyChamber}`),
    await learner.request(`/review-preview?${reportedInMyChamber}`),
    await learner.request('/sessions', {
      categoryId,
      questionCount: 1,
      questionScope: 'reported_in_my_chamber',
    }),
    await learner.request('/review-sessions', {
      questionCount: 1,
      questionScope: 'reported_in_my_chamber',
    }),
  ]) {
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ type: 'district_chamber_not_chosen' })
  }

  expect(
    await learner.read(OralSessionPreview, `/preview?categoryId=${categoryId}&questionScope=path`),
  ).toMatchObject({ questionScope: 'path', category: { availableQuestionCount: 3 } })
})

test('filtered previews and sessions include only questions reported in the chosen chamber', async () => {
  const learner = await chamberLearner()
  const { categoryId, reported } = await reportedCategory(learner.pathId)
  await learner.chooseChamber(opolskaEngineers)

  expect(await learner.read(OralSessionPreview, `/preview?categoryId=${categoryId}`)).toMatchObject(
    { questionScope: 'path', category: { availableQuestionCount: 3 } },
  )

  const filtered = await learner.read(
    OralSessionPreview,
    `/preview?categoryId=${categoryId}&${reportedInMyChamber}`,
  )

  expect(filtered).toMatchObject({
    questionScope: 'reported_in_my_chamber',
    category: { id: categoryId, availableQuestionCount: 2, completedQuestionCount: 0 },
    settings: { defaultQuestionCount: 2, maximumQuestionCount: 2 },
  })

  const tooMany = await learner.request('/sessions', {
    categoryId,
    questionCount: 3,
    questionScope: 'reported_in_my_chamber',
  })

  expect(tooMany.status).toBe(409)
  expect(await tooMany.json()).toMatchObject({ type: 'stale_session_preview' })

  const session = await learner.read(OralStudySession, '/sessions', {
    categoryId,
    questionCount: 2,
    questionScope: 'reported_in_my_chamber',
  })

  expect(await learner.sessionQuestionIds(session)).toEqual(reported)

  const outsidePath = await learner.request('/sessions', {
    categoryId: crypto.randomUUID(),
    questionCount: 1,
    questionScope: 'reported_in_my_chamber',
  })

  expect(outsidePath.status).toBe(404)
  expect(await outsidePath.json()).toMatchObject({ type: 'oral_category_not_found' })
})

test('the next filtered category is the first one with questions reported in the chosen chamber', async () => {
  const learner = await chamberLearner()
  await learner.chooseChamber(mazowieckaEngineers)

  expect(await learner.read(OralSessionPreview, `/preview?${reportedInMyChamber}`)).toMatchObject({
    questionScope: 'reported_in_my_chamber',
    category: { id: firstSeededCategory, availableQuestionCount: 2 },
  })
})

test('changing the chamber keeps the started session and affects only new previews', async () => {
  const learner = await chamberLearner()
  const { categoryId, reported, unreported } = await reportedCategory(learner.pathId)
  await learner.chooseChamber(opolskaEngineers)

  const session = await learner.read(OralStudySession, '/sessions', {
    categoryId,
    questionCount: 2,
    questionScope: 'reported_in_my_chamber',
  })

  await learner.chooseChamber(pomorskaEngineers)

  expect(await learner.sessionQuestionIds(session)).toEqual(reported)
  expect(
    await learner.read(
      OralSessionPreview,
      `/preview?categoryId=${categoryId}&${reportedInMyChamber}`,
    ),
  ).toMatchObject({ category: { availableQuestionCount: 1 } })

  const parallel = await learner.request('/sessions', {
    categoryId,
    questionCount: 1,
    questionScope: 'reported_in_my_chamber',
  })

  expect(parallel.status).toBe(409)
  expect(await parallel.json()).toMatchObject({
    type: 'oral_session_already_started',
    sessionId: session.id,
  })

  await learner.request(`/sessions/${session.id}/end`, {})

  const next = await learner.read(OralStudySession, '/sessions', {
    categoryId,
    questionCount: 1,
    questionScope: 'reported_in_my_chamber',
  })

  expect(await learner.sessionQuestionIds(next)).toEqual([unreported])
})

test('history and oral SRS are shared between the whole path and the chamber filter', async () => {
  const learner = await chamberLearner()
  const { categoryId, reported } = await reportedCategory(learner.pathId)
  await learner.chooseChamber(opolskaEngineers)

  const filteredStudy = await learner.read(OralStudySession, '/sessions', {
    categoryId,
    questionCount: 2,
    questionScope: 'reported_in_my_chamber',
  })

  await learner.assessAt(filteredStudy, '2026-11-10T12:00:00.000Z')

  expect(await learner.read(OralSessionPreview, `/preview?categoryId=${categoryId}`)).toMatchObject(
    { category: { availableQuestionCount: 3, completedQuestionCount: 2 } },
  )

  const wholePathStudy = await learner.read(OralStudySession, '/sessions', {
    categoryId,
    questionCount: 3,
  })

  await learner.assessAt(wholePathStudy, '2026-11-11T12:00:00.000Z')

  expect(
    await learner.read(OralReviewPreview, `/review-preview?categoryId=${categoryId}`),
  ).toMatchObject({ questionScope: 'path', dueQuestionCount: 3 })

  expect(
    await learner.read(
      OralReviewPreview,
      `/review-preview?categoryId=${categoryId}&${reportedInMyChamber}`,
    ),
  ).toMatchObject({
    questionScope: 'reported_in_my_chamber',
    dueQuestionCount: 2,
    settings: { maximumQuestionCount: 2 },
  })

  const review = await learner.read(OralStudySession, '/review-sessions', {
    categoryId,
    questionCount: 2,
    questionScope: 'reported_in_my_chamber',
  })

  expect(review).toMatchObject({ kind: 'review', progress: { total: 2 } })
  expect(await learner.sessionQuestionIds(review)).toEqual(reported)
})
