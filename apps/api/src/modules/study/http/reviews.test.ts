import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  DocumentResponse,
  LatestStudySessionResponse,
  ReviewPreview,
  SessionPreview,
  SessionQuestion,
  StudySession,
  StudySessionResponse,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Exit, Layer, Option, Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { cosmeticChange } from '~api/modules/learning-content/domain/learning-content.model.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { ReviewSchedulerLive } from '~api/modules/study/application/review-state.service.js'
import { submitAnswer } from '~api/modules/study/application/submit-answer.command.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { catalogueTestTime, fixedWallClockLayer } from '~api/test/clock.js'
import {
  addFixtureQuestion,
  createStudyFixture,
  currentReviewState,
  publishFixtureRevision,
  seededFixturePath,
  studySessionSpecialization,
  withdrawFixtureRevision,
} from '~api/test/learning-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

// Answers go through the command with a fixed earlier clock, so their review states are due by the
// API's business time (`catalogueTestTime`).
const commandLayer = Layer.mergeAll(
  StudyRepositoryLive,
  StudyReaderLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  ReviewSchedulerLive,
).pipe(Layer.provideMerge(databaseLayerFromConfig))

const daysBeforeNow = (days: number) => DateTime.subtract(catalogueTestTime, { days })

// The seeded small path: one Building Law document with three questions no test adds to, so its
// round can be completed by answering them.
const smallPathConfiguration = {
  specializationId: '60000000-0000-4000-8000-000000000002',
  qualificationKindId: '70000000-0000-4000-8000-000000000002',
  qualificationScopeId: '80000000-0000-4000-8000-000000000002',
  accessScope: 'both',
  examSessionId: '90000000-0000-4000-8000-000000000002',
  oralExamDate: null,
} satisfies typeof CompleteOnboardingPayload.Encoded

const learnerFor = async (pathId: QualificationPathId, config: CompleteOnboardingPayload) => {
  const visitor = await loginForPreparation(api)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${pathId}${path}`, body)

  const decode =
    <T, E>(schema: Schema.Codec<T, E>) =>
    async (response: Response) =>
      Schema.decodeUnknownSync(schema)(await response.json())

  const scope = (documentId?: string) =>
    documentId === undefined ? '' : `?documentId=${documentId}`

  const reviewPreview = async (documentId?: string) =>
    decode(Schema.NullOr(ReviewPreview))(await request(`/review-preview${scope(documentId)}`))

  const reviewSession = async (documentId?: string) =>
    decode(StudySessionResponse)(await request(`/review-session${scope(documentId)}`))

  const startReview = (questionCount: number, documentId?: string) =>
    request('/review-sessions', { questionCount, documentId })

  const question = async (sessionId: string, position: number) =>
    decode(SessionQuestion)(await request(`/sessions/${sessionId}/questions/${position}`))

  // The questions of a session in session order.
  const sessionQuestionIds = async (session: StudySession) => {
    const ids: Array<string> = []

    for (let position = 1; position <= session.progress.total; position++) {
      ids.push((await question(session.id, position)).questionId)
    }

    return ids
  }

  // Starts what the document's regular-study preview offers.
  const startStudy = async (documentId: string) => {
    const offered = await decode(SessionPreview)(await request(`/preview?documentId=${documentId}`))

    return decode(StudySession)(
      await request('/sessions', {
        documentId,
        questionCount: offered.settings.defaultQuestionCount,
        questionSelection: offered.questionSelection,
      }),
    )
  }

  // Answers a session question at the given backend time.
  const answerAt = async (
    at: DateTime.Utc,
    sessionId: string,
    position: number,
    isCorrect = true,
  ) => {
    const shown = await question(sessionId, position)

    const exit = await Effect.runPromiseExit(
      submitAnswer(
        visitor.userId,
        pathId,
        shown.sessionId,
        shown.position,
        shown.questionRevisionId,
        shown.answers.find(answer => answer.isCorrect === isCorrect)!.id,
      ).pipe(Effect.provide(Layer.merge(commandLayer, fixedWallClockLayer(at))), Effect.scoped),
    )

    expect(Exit.isSuccess(exit)).toBe(true)

    return shown
  }

  const answerNow = async (sessionId: string, position: number) => {
    const shown = await question(sessionId, position)

    return request(`/sessions/${sessionId}/questions/${position}/answer`, {
      questionRevisionId: shown.questionRevisionId,
      answerId: shown.answers.find(answer => answer.isCorrect)!.id,
    })
  }

  const end = (sessionId: string) => request(`/sessions/${sessionId}/end`, {})

  return {
    visitor,
    request,
    decode,
    reviewPreview,
    reviewSession,
    startReview,
    question,
    sessionQuestionIds,
    startStudy,
    answerAt,
    answerNow,
    end,
  }
}

// A learner on a fresh document of the shared session path with the given number of questions.
const learnerWithQuestions = async (questionCount: number) => {
  const fixture = await createStudyFixture(studySessionSpecialization)
  const questions: Array<Awaited<ReturnType<typeof addFixtureQuestion>>> = []

  for (let index = 0; index < questionCount; index++) {
    questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  }

  const learner = await learnerFor(fixture.pathId, fixture.config)

  return { ...learner, fixture, questions }
}

describe('nothing due', () => {
  test('a learner without review states has nothing due and nothing scheduled', async () => {
    const learner = await learnerWithQuestions(1)

    expect(await learner.reviewPreview()).toEqual({
      qualificationPathId: learner.fixture.pathId,
      document: null,
      dueQuestionCount: 0,
      nextDueAt: null,
      settings: null,
    })
  })

  test('the preview returns the next due time and no review session starts', async () => {
    const learner = await learnerWithQuestions(1)
    const study = await learner.startStudy(learner.fixture.documentId)

    expect((await learner.answerNow(study.id, 1)).status).toBe(200)

    const preview = await learner.reviewPreview()

    expect(preview).toMatchObject({ dueQuestionCount: 0, settings: null })
    expect(
      DateTime.isGreaterThan(DateTime.makeUnsafe(preview!.nextDueAt!), catalogueTestTime),
    ).toBe(true)

    const refused = await learner.startReview(1)

    expect(refused.status).toBe(409)
    expect(await refused.json()).toMatchObject({ type: 'stale_session_preview' })
    expect(await learner.reviewSession()).toBeNull()
  })
})

describe('due questions', () => {
  test('a review session takes the most overdue questions first and is never padded', async () => {
    const learner = await learnerWithQuestions(4)
    const study = await learner.startStudy(learner.fixture.documentId)
    const [, second, third] = await learner.sessionQuestionIds(study)

    await learner.answerAt(daysBeforeNow(1), study.id, 1, false)
    await learner.answerAt(daysBeforeNow(3), study.id, 2, false)
    await learner.answerAt(daysBeforeNow(2), study.id, 3, false)
    // Answered now, so its next review is still ahead.
    expect((await learner.answerNow(study.id, 4)).status).toBe(200)
    await learner.end(study.id)

    expect(await learner.reviewPreview()).toMatchObject({
      dueQuestionCount: 3,
      settings: {
        defaultQuestionCount: 3,
        canChangeQuestionCount: true,
        minimumQuestionCount: 1,
        maximumQuestionCount: 3,
      },
    })

    // More than the due questions is refused rather than padded with the one not due.
    expect((await learner.startReview(4)).status).toBe(409)

    const response = await learner.startReview(2)

    expect(response.status).toBe(200)

    const review = await learner.decode(StudySession)(response)

    expect(review).toMatchObject({ kind: 'review', status: 'active', progress: { total: 2 } })
    expect(await learner.sessionQuestionIds(review)).toEqual([second, third])
  })

  test('withdrawn questions and questions whose content was replaced are not due', async () => {
    const learner = await learnerWithQuestions(3)
    const study = await learner.startStudy(learner.fixture.documentId)
    const [withdrawn, replaced, polished] = learner.questions

    for (const position of [1, 2, 3]) {
      await learner.answerAt(daysBeforeNow(2), study.id, position, false)
    }

    await withdrawFixtureRevision(withdrawn!.revisionId)
    await publishFixtureRevision(replaced!.id)
    // A cosmetic revision keeps the state, so the question stays due.
    await publishFixtureRevision(polished!.id, cosmeticChange)

    expect(await learner.reviewPreview()).toMatchObject({ dueQuestionCount: 1 })

    const review = await learner.decode(StudySession)(await learner.startReview(1))

    expect(await learner.sessionQuestionIds(review)).toEqual([polished!.id])
  })

  test('a document scope draws only that document’s due questions', async () => {
    const learner = await learnerWithQuestions(1)
    const other = await createStudyFixture(studySessionSpecialization)
    const otherQuestion = await addFixtureQuestion(other.pathId, other.documentId)

    for (const documentId of [learner.fixture.documentId, other.documentId]) {
      const study = await learner.startStudy(documentId)

      await learner.answerAt(daysBeforeNow(1), study.id, 1, false)
      await learner.end(study.id)
    }

    expect(await learner.reviewPreview()).toMatchObject({ dueQuestionCount: 2 })
    expect(await learner.reviewPreview(other.documentId)).toMatchObject({
      document: { id: other.documentId, title: 'Test-only threshold document' },
      dueQuestionCount: 1,
    })

    const review = await learner.decode(StudySession)(
      await learner.startReview(1, other.documentId),
    )

    expect(await learner.sessionQuestionIds(review)).toEqual([otherQuestion.id])
  })

  test('a question answered on the current study day waits for the next study day', async () => {
    const learner = await learnerWithQuestions(2)
    const study = await learner.startStudy(learner.fixture.documentId)
    const [, answeredYesterday] = await learner.sessionQuestionIds(study)

    // A wrong answer an hour ago is due again within minutes, but no later answer today would
    // rate it, so a review would only repeat it without moving it.
    await learner.answerAt(DateTime.subtract(catalogueTestTime, { hours: 1 }), study.id, 1, false)
    await learner.answerAt(daysBeforeNow(1), study.id, 2, false)
    await learner.end(study.id)

    expect(await learner.reviewPreview()).toMatchObject({ dueQuestionCount: 1 })

    const review = await learner.decode(StudySession)(await learner.startReview(1))

    expect(await learner.sessionQuestionIds(review)).toEqual([answeredYesterday])
    expect((await learner.answerNow(review.id, 1)).status).toBe(200)

    // Midnight in Warsaw (UTC+1 in November) starts the next study day.
    expect(await learner.reviewPreview()).toEqual({
      qualificationPathId: learner.fixture.pathId,
      document: null,
      dueQuestionCount: 0,
      nextDueAt: '2026-11-13T23:00:00.000Z',
      settings: null,
    })
  })

  test('a document that is not on the path has no review preview and starts nothing', async () => {
    const learner = await learnerWithQuestions(1)
    const missing = crypto.randomUUID()

    expect(await learner.reviewPreview(missing)).toBeNull()
    expect((await learner.startReview(1, missing)).status).toBe(404)
  })
})

describe('unfinished review sessions', () => {
  test('each scope has at most one unfinished review session, apart from regular study', async () => {
    const learner = await learnerWithQuestions(2)
    const study = await learner.startStudy(learner.fixture.documentId)

    await learner.answerAt(daysBeforeNow(2), study.id, 1, false)
    await learner.answerAt(daysBeforeNow(1), study.id, 2, false)

    const pathReview = await learner.decode(StudySession)(await learner.startReview(1))
    const again = await learner.startReview(1)

    expect(again.status).toBe(409)
    expect(await again.json()).toMatchObject({
      type: 'study_session_already_started',
      sessionId: pathReview.id,
      currentPosition: 1,
    })
    expect(await learner.reviewSession()).toMatchObject({ id: pathReview.id, kind: 'review' })

    // Another scope is a separate session.
    expect(await learner.reviewSession(learner.fixture.documentId)).toBeNull()

    const documentReview = await learner.decode(StudySession)(
      await learner.startReview(1, learner.fixture.documentId),
    )

    expect(await learner.reviewSession(learner.fixture.documentId)).toMatchObject({
      id: documentReview.id,
    })

    // "Continue learning" stays with regular study.
    expect(
      await learner.decode(LatestStudySessionResponse)(await learner.request('/latest-session')),
    ).toMatchObject({ id: study.id, kind: 'study' })

    // Ending it lets the scope start a new one.
    await learner.end(pathReview.id)
    expect(await learner.reviewSession()).toBeNull()
    expect((await learner.startReview(1)).status).toBe(200)
  })
})

describe('answering a review session', () => {
  test('a review answer updates SRS but never covers the question in the round', async () => {
    const { pathId, config } = await seededFixturePath(smallPathConfiguration)
    const learner = await learnerFor(pathId, config)

    const [document] = Schema.decodeUnknownSync(
      Schema.Struct({ data: Schema.Array(Schema.Struct({ id: Schema.String })) }),
    )(await (await learner.request('/documents')).json()).data

    const documentProgress = async () =>
      learner.decode(DocumentResponse)(await learner.request(`/documents/${document!.id}`))

    // Covering every question of the small path in the past completes round 1, so each is due
    // and uncovered in round 2.
    const study = await learner.startStudy(document!.id)

    for (let position = 1; position <= study.progress.total; position++) {
      await learner.answerAt(daysBeforeNow(2), study.id, position, false)
    }

    await learner.end(study.id)

    expect((await documentProgress()).document).toMatchObject({ completedQuestionCount: 0 })

    const review = await learner.decode(StudySession)(await learner.startReview(1))
    const shown = await learner.question(review.id, 1)

    const before = Option.getOrThrow(
      await currentReviewState(learner.visitor.userId, pathId, shown.questionId),
    )

    expect((await learner.answerNow(review.id, 1)).status).toBe(200)

    const after = Option.getOrThrow(
      await currentReviewState(learner.visitor.userId, pathId, shown.questionId),
    )

    expect(after.reps).toBe(before.reps + 1)
    expect(DateTime.isGreaterThan(after.dueAt, catalogueTestTime)).toBe(true)
    expect((await documentProgress()).document).toMatchObject({ completedQuestionCount: 0 })
    expect(
      await learner.decode(SessionPreview)(
        await learner.request(`/preview?documentId=${document!.id}`),
      ),
    ).toMatchObject({
      questionSelection: 'uncovered',
      availableQuestionCount: study.progress.total,
    })
  })

  test('a withdrawn question is skipped in a review session as in regular study', async () => {
    const learner = await learnerWithQuestions(2)
    const study = await learner.startStudy(learner.fixture.documentId)

    await learner.answerAt(daysBeforeNow(2), study.id, 1, false)
    await learner.answerAt(daysBeforeNow(1), study.id, 2, false)

    const review = await learner.decode(StudySession)(await learner.startReview(2))
    const first = await learner.question(review.id, 1)

    await withdrawFixtureRevision(first.questionRevisionId)

    const refused = await learner.answerNow(review.id, 1)

    expect(refused.status).toBe(409)
    expect(await refused.json()).toMatchObject({ type: 'session_question_withdrawn' })
    expect(
      await learner.decode(StudySessionResponse)(await learner.request(`/sessions/${review.id}`)),
    ).toMatchObject({ progress: { total: 2, skipped: 1, answered: 0, currentQuestion: 1 } })
  })
})

describe('the review summary', () => {
  test('an ended review session has a summary of its kind and scope', async () => {
    const learner = await learnerWithQuestions(1)
    const study = await learner.startStudy(learner.fixture.documentId)

    await learner.answerAt(daysBeforeNow(1), study.id, 1, false)

    const review = await learner.decode(StudySession)(await learner.startReview(1))

    expect((await learner.answerNow(review.id, 1)).status).toBe(200)
    await learner.end(review.id)

    const summary = await learner.decode(StudySessionSummary)(
      await learner.request(`/sessions/${review.id}/summary`),
    )

    expect(summary).toMatchObject({
      kind: 'review',
      document: null,
      result: { correct: 1, incorrect: 0, correctPercent: 100 },
    })
  })
})
