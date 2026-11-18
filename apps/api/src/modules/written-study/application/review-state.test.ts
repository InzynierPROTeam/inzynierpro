import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionPreview,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { DateTime, Effect, Exit, Layer, Option, Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { TransactionLive } from '~api/lib/transaction.js'
import { cosmeticChange } from '~api/modules/learning-content/domain/learning-content.model.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import { submitAnswer } from '~api/modules/written-study/application/submit-answer.command.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { fixedWallClockLayer } from '~api/test/clock.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import {
  addFixtureQuestion,
  currentReviewState,
  publishFixtureRevision,
} from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const commandServices = Layer.mergeAll(
  TransactionLive,
  StudyReaderLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
  XpReaderLive,
  XpRepositoryLive,
)

const commandLayer = Layer.merge(StudyRepositoryLive, commandServices).pipe(
  Layer.provideMerge(databaseLayerFromConfig),
)

const failingReviewStateLayer = Layer.effect(
  StudyRepository,
  Effect.gen(function* () {
    const studyRepository = yield* StudyRepository
    const missingRevision = yield* Schema.decodeEffect(QuestionRevisionId)(crypto.randomUUID())

    return StudyRepository.of({
      ...studyRepository,
      storeReviewState: state =>
        studyRepository.storeReviewState({ ...state, questionRevisionId: missingRevision }),
    })
  }),
).pipe(Layer.provide(StudyRepositoryLive))

const failingCommandLayer = Layer.merge(failingReviewStateLayer, commandServices).pipe(
  Layer.provideMerge(databaseLayerFromConfig),
)

const day1 = '2026-11-13T11:00:00.000Z'

const day1Later = '2026-11-13T19:00:00.000Z'

const day2 = '2026-11-14T11:00:00.000Z'

const learnerWithQuestion = async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const question = await addFixtureQuestion(fixture.pathId, fixture.documentId)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const startSession = async () => {
    const preview = Schema.decodeUnknownSync(SessionPreview)(
      await (await request(`/preview?documentId=${fixture.documentId}`)).json(),
    )

    return Schema.decodeUnknownSync(StudySession)(
      await (
        await request('/sessions', {
          documentId: fixture.documentId,
          questionCount: preview.settings.defaultQuestionCount,
          questionSelection: preview.questionSelection,
        })
      ).json(),
    )
  }

  const readQuestion = async (sessionId: string) =>
    Schema.decodeUnknownSync(SessionQuestion)(
      await (await request(`/sessions/${sessionId}/questions/1`)).json(),
    )

  const submitAt = (
    at: string,
    session: StudySession,
    shown: SessionQuestion,
    isCorrect: boolean,
    layer: typeof commandLayer | typeof failingCommandLayer = commandLayer,
  ) =>
    Effect.runPromiseExit(
      submitAnswer(
        visitor.userId,
        fixture.pathId,
        session.id,
        shown.position,
        shown.questionRevisionId,
        shown.answers.find(answer => answer.isCorrect === isCorrect)!.id,
      ).pipe(
        Effect.provide(Layer.merge(layer, fixedWallClockLayer(DateTime.makeUnsafe(at)))),
        Effect.scoped,
      ),
    )

  const saveNote = (text: string) =>
    visitor.jar.fetch(
      new URL(`/api/v1/study/paths/${fixture.pathId}/notes/${question.id}`, api.baseUrl),
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      },
    )

  const answerAt = async (
    at: string,
    {
      isCorrect,
      afterExplanation = false,
      afterNote = false,
    }: { isCorrect: boolean; afterExplanation?: boolean; afterNote?: boolean },
  ) => {
    const session = await startSession()

    if (afterNote) {
      await saveNote('Memory aid.')
      await request(`/sessions/${session.id}/questions/1/assistance`, { kind: 'note' })
    }

    if (afterExplanation) {
      await request(`/sessions/${session.id}/questions/1/assistance`, { kind: 'explanation' })
    }

    const exit = await submitAt(at, session, await readQuestion(session.id), isCorrect)

    expect(Exit.isSuccess(exit)).toBe(true)
    await request(`/sessions/${session.id}/end`, {})
  }

  const state = () => currentReviewState(visitor.userId, fixture.pathId, question.id)

  return { question, request, startSession, readQuestion, submitAt, answerAt, state }
}

const minutesAfter = (at: string, minutes: number) =>
  DateTime.add(DateTime.makeUnsafe(at), { minutes })

describe('a new card', () => {
  test('an independent correct answer rates it Good', async () => {
    const learner = await learnerWithQuestion()

    expect(await learner.state()).toEqual(Option.none())

    await learner.answerAt(day1, { isCorrect: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'review',
      reps: 1,
      lapses: 0,
      lastReviewAt: Option.some(DateTime.makeUnsafe(day1)),
    })
  })

  test('a correct answer after the explanation rates it Again for an early independent check', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true, afterExplanation: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'learning',
      reps: 1,
      dueAt: minutesAfter(day1, 1),
    })
  })

  test('a correct answer after the note rates it Hard', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true, afterNote: true })

    const state = Option.getOrThrow(await learner.state())

    expect(state).toMatchObject({ scheduleStatus: 'learning', reps: 1, lapses: 0 })
    expect(DateTime.isGreaterThan(state.dueAt, minutesAfter(day1, 1))).toBe(true)
  })

  test('the explanation wins over the note', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true, afterNote: true, afterExplanation: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'learning',
      reps: 1,
      dueAt: minutesAfter(day1, 1),
    })
  })

  test('a wrong answer rates it Again', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: false })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'learning',
      reps: 1,
      dueAt: minutesAfter(day1, 1),
    })
  })
})

describe('an existing card', () => {
  test('an independent correct answer on a later day rates it Good', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const before = Option.getOrThrow(await learner.state())
    await learner.answerAt(day2, { isCorrect: true })

    const after = Option.getOrThrow(await learner.state())

    expect(after).toMatchObject({ scheduleStatus: 'review', reps: 2, lapses: 0 })
    expect(after.stability).toBeGreaterThan(before.stability)
  })

  test('a correct answer after the note on a later day rates it Hard', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const good = Option.getOrThrow(await learner.state())

    await learner.answerAt(day2, { isCorrect: true, afterNote: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'review',
      reps: 2,
      lapses: 0,
      lastReviewAt: Option.some(DateTime.makeUnsafe(day2)),
    })
    expect(Option.getOrThrow(await learner.state()).scheduledDays).toBeGreaterThanOrEqual(
      good.scheduledDays,
    )
  })

  test('a correct answer after the explanation keeps the state', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const before = await learner.state()
    await learner.answerAt(day2, { isCorrect: true, afterExplanation: true })

    expect(await learner.state()).toEqual(before)
  })

  test('a wrong answer after the explanation rates it Again', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    await learner.answerAt(day2, { isCorrect: false, afterExplanation: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      reps: 2,
      lapses: 1,
      lastReviewAt: Option.some(DateTime.makeUnsafe(day2)),
    })
  })
})

describe('the study day', () => {
  test('a later correct answer the same day stays in history only', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const first = await learner.state()
    await learner.answerAt(day1Later, { isCorrect: true })

    expect(await learner.state()).toEqual(first)
  })

  test('a later answer the same day does not rate even when the first one kept the state', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const kept = await learner.state()
    await learner.answerAt(day2, { isCorrect: true, afterExplanation: true })
    await learner.answerAt('2026-11-14T19:00:00.000Z', { isCorrect: true })

    expect(await learner.state()).toEqual(kept)
  })

  test('a later wrong answer the same day still applies Again', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    await learner.answerAt(day1Later, { isCorrect: false })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      reps: 2,
      lapses: 1,
      lastReviewAt: Option.some(DateTime.makeUnsafe(day1Later)),
    })
  })

  test('a new study day starts at midnight in Warsaw, not in UTC', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt('2026-11-13T22:30:00.000Z', { isCorrect: true })
    await learner.answerAt('2026-11-13T23:30:00.000Z', { isCorrect: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps: 2 })
  })

  test('answers on different UTC dates share one Warsaw study day', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt('2026-11-13T23:30:00.000Z', { isCorrect: true })
    await learner.answerAt('2026-11-14T00:30:00.000Z', { isCorrect: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps: 1 })
  })
})

describe('the answer transaction', () => {
  test('retrying the same answer does not apply SRS twice', async () => {
    const learner = await learnerWithQuestion()
    const session = await learner.startSession()
    const shown = await learner.readQuestion(session.id)

    await learner.submitAt(day1, session, shown, false)
    const once = await learner.state()
    const retried = await learner.submitAt(day1, session, shown, false)

    expect(Exit.isSuccess(retried)).toBe(true)
    expect(await learner.state()).toEqual(once)
    expect(Option.getOrThrow(once)).toMatchObject({ reps: 1, lapses: 0 })
  })

  test('a failure storing the review state keeps no answer, and a retry stores both', async () => {
    const learner = await learnerWithQuestion()
    const session = await learner.startSession()
    const shown = await learner.readQuestion(session.id)

    const failed = await learner.submitAt(day1, session, shown, true, failingCommandLayer)

    expect(Exit.isFailure(failed)).toBe(true)
    expect((await learner.readQuestion(session.id)).answer).toBeNull()
    expect(await learner.state()).toEqual(Option.none())

    const retried = await learner.submitAt(day1, session, shown, true)

    expect(Exit.isSuccess(retried)).toBe(true)
    expect((await learner.readQuestion(session.id)).answer).not.toBeNull()
    expect(Option.getOrThrow(await learner.state())).toMatchObject({ reps: 1 })
  })
})

describe('revisions', () => {
  test('a cosmetic revision keeps the state', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const before = await learner.state()
    await publishFixtureRevision(learner.question.id, cosmeticChange)

    expect(await learner.state()).toEqual(before)
  })

  test('a substantive revision resets the state to a new card', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    await publishFixtureRevision(learner.question.id)

    expect(await learner.state()).toEqual(Option.none())

    await learner.answerAt(day2, { isCorrect: true, afterExplanation: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'learning',
      reps: 1,
      lapses: 0,
    })
  })
  test('an answer to the replaced content keeps the reset card new', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    const session = await learner.startSession()
    const shown = await learner.readQuestion(session.id)
    await publishFixtureRevision(learner.question.id)

    expect(Exit.isSuccess(await learner.submitAt(day2, session, shown, false))).toBe(true)
    expect(await learner.state()).toEqual(Option.none())
  })

  test('an answer to the replaced content does not use up the study day of the new content', async () => {
    const learner = await learnerWithQuestion()

    await learner.answerAt(day1, { isCorrect: true })
    await publishFixtureRevision(learner.question.id)
    await learner.answerAt(day1Later, { isCorrect: true })

    expect(Option.getOrThrow(await learner.state())).toMatchObject({
      scheduleStatus: 'review',
      reps: 1,
      lastReviewAt: Option.some(DateTime.makeUnsafe(day1Later)),
    })
  })
})
