import { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { DocumentResponse } from '@inzpro/api-contracts/modules/written-study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { DateTime, Effect, Exit, Layer, Option } from 'effect'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { TransactionLive } from '~api/lib/transaction.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import { ReviewScheduler } from '~api/modules/learning/application/review-scheduler.service.js'
import { finishAttemptAtDeadline } from '~api/modules/mock-exams/application/attempt-deadline.job.js'
import { finishAttempt } from '~api/modules/mock-exams/application/finish-attempt.command.js'
import { MockExamReaderLive } from '~api/modules/mock-exams/infrastructure/mock-exam.reader.postgres.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { catalogueTestTime, fixedWallClockLayer } from '~api/test/clock.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { decodeResponse, mockExamLearner } from '~api/test/mock-exam-learner.js'
import { runFixture } from '~api/test/run-fixture.js'
import {
  currentReviewState,
  learningEventOnStudyDay,
  withdrawFixtureRevision,
} from '~api/test/written-learning-fixtures.js'

const examPath = mockExamPathConfiguration('60000000-0000-4000-8000-000000000009')
const afterDeadline = DateTime.add(catalogueTestTime, { minutes: 10, seconds: 1 })

let api: TestApi
let lateApi: TestApi

beforeAll(async () => {
  ;[api, lateApi] = await Promise.all([startTestApi(), startTestApi({ now: afterDeadline })])
})

afterAll(() => Promise.all([api.close(), lateApi.close()]))

type Learner = Awaited<ReturnType<typeof mockExamLearner>>

const examLearner = async (questionCount: number) => {
  const pathId = await resolveFixturePath(examPath)

  const { documents } = await createMockExamFixture(
    pathId,
    [{ questionCount, eligibleQuestions: questionCount }],
    1,
  )

  const learner = await mockExamLearner(api, examPath)

  return { learner, documentId: documents[0]!.documentId }
}

const startedQuestions = async (learner: Learner) => {
  const attempt = await learner.started()

  return { attempt, questions: await learner.questions(attempt) }
}

const option = (
  question: Awaited<ReturnType<typeof startedQuestions>>['questions'][number],
  text: 'A' | 'B',
) => {
  const answer = question.answers.find(candidate => candidate.text === text)

  if (answer === undefined) {
    throw new Error(`Missing fixture answer ${text}`)
  }

  return answer.id
}

const finish = async (learner: Learner, attemptId: string) =>
  decodeResponse(MockExamAttempt)(await learner.request(`/attempts/${attemptId}/finish`, 'POST'))

const reviewState = async (learner: Learner, questionId: WrittenQuestionId) =>
  Option.getOrNull(await currentReviewState(learner.userId, learner.pathId, questionId))

const hasLearningEvent = (
  learner: Learner,
  question: Awaited<ReturnType<typeof startedQuestions>>['questions'][number],
) =>
  learningEventOnStudyDay(
    learner.userId,
    learner.pathId,
    question.questionRevisionId,
    catalogueTestTime,
  )

const minutesAfter = (at: string, minutes: number) =>
  DateTime.add(DateTime.makeUnsafe(at), { minutes })

const answerOnly = async (learner: Learner, text: 'A' | 'B') => {
  const { attempt, questions } = await startedQuestions(learner)
  const [question] = questions

  if (question === undefined) {
    throw new Error('Missing question')
  }

  await learner.saveAnswer(attempt.id, question.position, {
    answerId: option(question, text),
    expectedVersion: question.version,
  })

  return { attempt, question }
}

it('feeds final answers to written SRS, ignores draft changes and unanswered questions and leaves the round alone', async () => {
  const { learner, documentId } = await examLearner(3)
  const { attempt, questions } = await startedQuestions(learner)
  const [changed, wrong, unanswered] = questions

  if (changed === undefined || wrong === undefined || unanswered === undefined) {
    throw new Error('Missing questions')
  }

  await learner.saveAnswer(attempt.id, changed.position, {
    answerId: option(changed, 'B'),
    expectedVersion: changed.version,
  })
  await learner.saveAnswer(attempt.id, changed.position, {
    answerId: option(changed, 'A'),
    expectedVersion: changed.version + 1,
  })
  await learner.saveAnswer(attempt.id, wrong.position, {
    answerId: option(wrong, 'B'),
    expectedVersion: wrong.version,
  })

  expect(await reviewState(learner, changed.questionId)).toBeNull()
  expect(await hasLearningEvent(learner, changed)).toBe(false)
  expect(await hasLearningEvent(learner, wrong)).toBe(false)

  const finished = await finish(learner, attempt.id)
  const finishedAt = finished.finishedAt!

  expect(await reviewState(learner, changed.questionId)).toMatchObject({
    scheduleStatus: 'review',
    reps: 1,
    lapses: 0,
    lastReviewAt: Option.some(DateTime.makeUnsafe(finishedAt)),
  })
  expect(await reviewState(learner, wrong.questionId)).toMatchObject({
    scheduleStatus: 'learning',
    reps: 1,
    dueAt: minutesAfter(finishedAt, 1),
  })
  expect(await reviewState(learner, unanswered.questionId)).toBeNull()
  expect(await hasLearningEvent(learner, changed)).toBe(true)
  expect(await hasLearningEvent(learner, wrong)).toBe(true)
  expect(await hasLearningEvent(learner, unanswered)).toBe(false)
  expect(
    (await decodeResponse(DocumentResponse)(await learner.studyRequest(`/documents/${documentId}`)))
      .document.completedQuestionCount,
  ).toBe(0)
})

it('applies only the first exam answer of the study day, except a later wrong answer', async () => {
  const { learner } = await examLearner(1)

  const first = await answerOnly(learner, 'A')
  await finish(learner, first.attempt.id)
  const afterFirst = await reviewState(learner, first.question.questionId)

  expect(afterFirst).toMatchObject({ scheduleStatus: 'review', reps: 1 })

  const repeated = await answerOnly(learner, 'A')
  await finish(learner, repeated.attempt.id)

  expect(await reviewState(learner, first.question.questionId)).toStrictEqual(afterFirst)

  const failed = await answerOnly(learner, 'B')
  const finished = await finish(learner, failed.attempt.id)

  expect(await reviewState(learner, first.question.questionId)).toMatchObject({
    reps: 2,
    lapses: 1,
    lastReviewAt: Option.some(DateTime.makeUnsafe(finished.finishedAt!)),
  })
})

it('feeds the saved answers of an attempt that runs out of time', async () => {
  const { learner } = await examLearner(1)
  const { attempt, question } = await answerOnly(learner, 'A')

  const expired = await learner.on(lateApi).attempt(attempt.id)

  expect(expired).toMatchObject({ endReason: 'time-expired' })
  expect(await reviewState(learner, question.questionId)).toMatchObject({
    scheduleStatus: 'review',
    reps: 1,
    lastReviewAt: Option.some(DateTime.makeUnsafe(expired!.finishedAt!)),
  })
})

it('feeds the saved answers when the deadline job finishes an abandoned tab', async () => {
  const { learner } = await examLearner(1)
  const { attempt, question } = await answerOnly(learner, 'B')

  await runFixture(
    finishAttemptAtDeadline({
      attemptId: attempt.id,
      userId: learner.userId,
      qualificationPathId: learner.pathId,
      deadline: DateTime.makeUnsafe(attempt.deadline),
    }).pipe(Effect.provide(fixedWallClockLayer(afterDeadline))),
  )

  const finished = await learner.attempt(attempt.id)

  expect(finished).toMatchObject({ endReason: 'time-expired' })
  expect(await reviewState(learner, question.questionId)).toMatchObject({
    scheduleStatus: 'learning',
    reps: 1,
    dueAt: minutesAfter(finished!.finishedAt!, 1),
  })
})

it('records nothing for a question withdrawn before the attempt finishes', async () => {
  const { learner } = await examLearner(1)
  const { attempt, question } = await answerOnly(learner, 'A')

  await withdrawFixtureRevision(question.questionRevisionId)
  await finish(learner, attempt.id)

  expect(await reviewState(learner, question.questionId)).toBeNull()
  expect(await hasLearningEvent(learner, question)).toBe(false)
})

it('leaves neither a result nor SRS evidence when finishing fails', async () => {
  const { learner } = await examLearner(1)
  const { attempt, question } = await answerOnly(learner, 'A')

  const failingScheduler = Layer.succeed(ReviewScheduler)(
    ReviewScheduler.of({
      review: () => {
        throw new Error('Scheduler failure')
      },
    }),
  )

  const exit = await Effect.runPromiseExit(
    finishAttempt(learner.userId, learner.pathId, attempt.id).pipe(
      Effect.provide(
        Layer.mergeAll(
          TransactionLive,
          MockExamReaderLive,
          MockExamRepositoryLive,
          PreparationReaderLive,
          PreparationRepositoryLive,
          StudyReaderLive,
          StudyRepositoryLive,
          StreakReaderLive,
          StreakRepositoryLive,
          XpRepositoryLive,
          failingScheduler,
        ).pipe(Layer.provideMerge(databaseLayerFromConfig)),
      ),
      Effect.scoped,
    ),
  )

  expect(Exit.isFailure(exit)).toBe(true)
  expect(
    await (await learner.visitor.jar.fetch(new URL('/api/v1/learning-xp', api.baseUrl))).json(),
  ).toEqual({ total: 0 })
  expect(await learner.attempt(attempt.id)).toMatchObject({ status: 'in-progress', result: null })
  expect(await reviewState(learner, question.questionId)).toBeNull()
  expect(await hasLearningEvent(learner, question)).toBe(false)

  await finish(learner, attempt.id)

  expect(await reviewState(learner, question.questionId)).toMatchObject({ reps: 1 })
})
