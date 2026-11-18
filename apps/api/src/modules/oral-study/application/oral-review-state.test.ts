import {
  OralSessionPreview,
  OralSessionQuestion,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionPreview,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { OralSelfAssessment } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { DateTime, Effect, Exit, Layer, Option, Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { TransactionLive } from '~api/lib/transaction.js'
import { cosmeticChange } from '~api/modules/learning-content/domain/learning-content.model.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
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
  currentOralReviewState,
  publishFixtureOralRevision,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion, currentReviewState } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const commandServices = Layer.mergeAll(
  TransactionLive,
  OralStudyReaderLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
)

const failingReviewStateLayer = Layer.effect(
  OralStudyRepository,
  Effect.gen(function* () {
    const oralStudyRepository = yield* OralStudyRepository
    const missingRevision = yield* Schema.decodeEffect(OralRevisionId)(crypto.randomUUID())

    return OralStudyRepository.of({
      ...oralStudyRepository,
      storeReviewState: state =>
        oralStudyRepository.storeReviewState({ ...state, oralRevisionId: missingRevision }),
    })
  }),
).pipe(Layer.provide(OralStudyRepositoryLive))

const failingCommandLayer = Layer.merge(failingReviewStateLayer, commandServices).pipe(
  Layer.provideMerge(databaseLayerFromConfig),
)

const day1 = '2026-11-13T11:00:00.000Z'

const day1Later = '2026-11-13T19:00:00.000Z'

const day2 = '2026-11-14T11:00:00.000Z'

const learnerWithQuestion = async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const categoryId = await addFixtureOralCategory()
  const question = await addFixtureOralQuestion(fixture.pathId, categoryId, 1)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}/oral${path}`, body)

  const startSession = async () => {
    const preview = Schema.decodeUnknownSync(OralSessionPreview)(
      await (await request(`/preview?categoryId=${categoryId}`)).json(),
    )

    return Schema.decodeUnknownSync(OralStudySession)(
      await (
        await request('/sessions', {
          categoryId,
          questionCount: preview.settings.defaultQuestionCount,
        })
      ).json(),
    )
  }

  const readQuestion = async (sessionId: string) =>
    Schema.decodeUnknownSync(OralSessionQuestion)(
      await (await request(`/sessions/${sessionId}/questions/1`)).json(),
    )

  const submitCommandAt = (
    at: string,
    session: OralStudySession,
    shown: OralSessionQuestion,
    selfAssessment: OralSelfAssessment,
  ) =>
    Effect.runPromiseExit(
      submitOralSelfAssessment(
        visitor.userId,
        fixture.pathId,
        session.id,
        shown.position,
        shown.oralRevisionId,
        selfAssessment,
      ).pipe(
        Effect.provide(
          Layer.merge(failingCommandLayer, fixedWallClockLayer(DateTime.makeUnsafe(at))),
        ),
        Effect.scoped,
      ),
    )

  const submitAt = async (
    at: string,
    session: OralStudySession,
    shown: OralSessionQuestion,
    selfAssessment: OralSelfAssessment,
  ) => {
    const timedApi = await startTestApi({ now: DateTime.makeUnsafe(at) })

    try {
      return await learningRequest(
        timedApi,
        visitor,
        `/paths/${fixture.pathId}/oral/sessions/${session.id}/questions/${shown.position}/self-assessment`,
        { oralRevisionId: shown.oralRevisionId, selfAssessment },
      )
    } finally {
      await timedApi.close()
    }
  }

  const answerAt = async (at: string, selfAssessment: OralSelfAssessment) => {
    const session = await startSession()
    const response = await submitAt(at, session, await readQuestion(session.id), selfAssessment)
    expect(response.status).toBe(200)
    await request(`/sessions/${session.id}/end`, {})
  }

  const state = () => currentOralReviewState(visitor.userId, fixture.pathId, question.id)

  return {
    visitor,
    fixture,
    categoryId,
    question,
    request,
    startSession,
    readQuestion,
    submitAt,
    submitCommandAt,
    answerAt,
    state,
  }
}

const minutesAfter = (at: string, minutes: number) =>
  DateTime.add(DateTime.makeUnsafe(at), { minutes })

describe('oral FSRS evidence', () => {
  test.each(['hard', 'medium', 'easy'] as const)(
    'schedules a new card for %s',
    async selfAssessment => {
      const learner = await learnerWithQuestion()
      expect(await learner.state()).toEqual(Option.none())
      await learner.answerAt(day1, selfAssessment)
      const card = Option.getOrThrow(await learner.state())
      expect(card).toMatchObject({
        reps: 1,
        lapses: 0,
        lastReviewAt: Option.some(DateTime.makeUnsafe(day1)),
      })

      if (selfAssessment === 'easy') {
        expect(card.scheduleStatus).toBe('review')
      } else if (selfAssessment === 'hard') {
        expect(card.dueAt).toEqual(minutesAfter(day1, 1))
      } else {
        expect(DateTime.isGreaterThan(card.dueAt, minutesAfter(day1, 1))).toBe(true)
      }
    },
  )

  test('later successes keep the state, while a later hard assessment still applies Again', async () => {
    const learner = await learnerWithQuestion()
    await learner.answerAt(day1, 'easy')
    const first = await learner.state()
    await learner.answerAt(day1Later, 'medium')
    await learner.answerAt(day1Later, 'easy')
    expect(await learner.state()).toEqual(first)
    await learner.answerAt(day1Later, 'hard')
    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps: 2, lapses: 1 })
  })

  test('a later-day success updates an existing card', async () => {
    const learner = await learnerWithQuestion()
    await learner.answerAt(day1, 'easy')
    await learner.answerAt(day2, 'medium')
    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      reps: 2,
      lastReviewAt: Option.some(DateTime.makeUnsafe(day2)),
    })
  })

  test.each([
    ['2026-11-13T22:59:00.000Z', '2026-11-13T23:00:00.000Z', 2],
    ['2026-11-13T23:30:00.000Z', '2026-11-14T00:30:00.000Z', 1],
    ['2026-03-29T21:59:00.000Z', '2026-03-29T22:00:00.000Z', 2],
  ] as const)('uses Warsaw study days from %s to %s', async (first, second, reps) => {
    const learner = await learnerWithQuestion()
    await learner.answerAt(first, 'easy')
    await learner.answerAt(second, 'easy')
    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps })
  })

  test('concurrent retries apply the self-assessment and SRS only once', async () => {
    const learner = await learnerWithQuestion()
    const session = await learner.startSession()
    const shown = await learner.readQuestion(session.id)

    const results = await Promise.all([
      learner.submitAt(day1, session, shown, 'hard'),
      learner.submitAt(day1, session, shown, 'hard'),
    ])

    expect(results.every(response => response.status === 200)).toBe(true)
    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps: 1 })
  })

  test('a failed SRS write rolls back the self-assessment and history so a retry stores both', async () => {
    const learner = await learnerWithQuestion()
    const session = await learner.startSession()
    const shown = await learner.readQuestion(session.id)
    expect(Exit.isFailure(await learner.submitCommandAt(day1, session, shown, 'easy'))).toBe(true)
    expect((await learner.readQuestion(session.id)).selfAssessment).toBeNull()
    expect(await learner.state()).toEqual(Option.none())
    expect((await learner.submitAt(day1, session, shown, 'easy')).status).toBe(200)
    expect((await learner.readQuestion(session.id)).selfAssessment).not.toBeNull()
    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps: 1 })
  })

  test('cosmetic publication keeps the card and substantive publication resets it', async () => {
    const learner = await learnerWithQuestion()
    await learner.answerAt(day1, 'easy')
    const before = await learner.state()
    await publishFixtureOralRevision(learner.question.id, cosmeticChange)
    expect(await learner.state()).toEqual(before)
    await learner.answerAt(day1Later, 'easy')
    expect(await learner.state()).toEqual(before)
    await publishFixtureOralRevision(learner.question.id)
    expect(await learner.state()).toEqual(Option.none())
    await learner.answerAt(day1Later, 'hard')
    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      reps: 1,
      lapses: 0,
      dueAt: minutesAfter(day1Later, 1),
    })
  })

  test('replaced pinned content cannot update or consume the study day of the new content', async () => {
    const learner = await learnerWithQuestion()
    const session = await learner.startSession()
    const shown = await learner.readQuestion(session.id)
    await publishFixtureOralRevision(learner.question.id)
    expect((await learner.submitAt(day1, session, shown, 'hard')).status).toBe(200)
    expect(await learner.state()).toEqual(Option.none())
    await learner.request(`/sessions/${session.id}/end`, {})
    await learner.answerAt(day1Later, 'easy')
    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      reps: 1,
      scheduleStatus: 'review',
    })
  })
})

test('written and oral evidence keep independent cards for the same learner and path', async () => {
  const learner = await learnerWithQuestion()
  const { visitor, fixture } = learner
  const written = await addFixtureQuestion(fixture.pathId, fixture.documentId)

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const preview = Schema.decodeUnknownSync(SessionPreview)(
    await (await request(`/preview?documentId=${fixture.documentId}`)).json(),
  )

  const session = Schema.decodeUnknownSync(StudySession)(
    await (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount: preview.settings.defaultQuestionCount,
        questionSelection: preview.questionSelection,
      })
    ).json(),
  )

  const shown = Schema.decodeUnknownSync(SessionQuestion)(
    await (await request(`/sessions/${session.id}/questions/1`)).json(),
  )

  const response = await request(`/sessions/${session.id}/questions/1/answer`, {
    questionRevisionId: shown.questionRevisionId,
    answerId: shown.answers.find(answer => answer.isCorrect)!.id,
  })

  expect(response.status).toBe(200)
  const writtenBefore = await currentReviewState(visitor.userId, fixture.pathId, written.id)
  expect(Option.getOrThrow(writtenBefore)).toMatchObject({ reps: 1 })
  expect(await learner.state()).toEqual(Option.none())
  await learner.answerAt(day1, 'hard')
  expect(Option.getOrThrow(await learner.state())).toMatchObject({
    reps: 1,
    scheduleStatus: 'learning',
  })
  expect(await currentReviewState(visitor.userId, fixture.pathId, written.id)).toEqual(
    writtenBefore,
  )
})
