import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction, TransactionLive } from '~api/lib/transaction.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { failXpWrite } from '~api/modules/learning-xp/http/errors.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { failStudyRead, failStudyWrite } from '~api/modules/learning/http/errors.js'
import { abandonAttempt } from '~api/modules/mock-exams/application/abandon-attempt.command.js'
import { AttemptDeadlineQueueLive } from '~api/modules/mock-exams/application/attempt-deadline.job.js'
import { getAttemptQuestion } from '~api/modules/mock-exams/application/attempt-question.query.js'
import {
  expireAttemptBeforeRead,
  expireUnfinishedAttemptBeforeRead,
} from '~api/modules/mock-exams/application/expire-attempt.command.js'
import { finishAttempt } from '~api/modules/mock-exams/application/finish-attempt.command.js'
import { flagAttemptQuestion } from '~api/modules/mock-exams/application/flag-attempt-question.command.js'
import { getMockExamAttempt } from '~api/modules/mock-exams/application/mock-exam-attempt.query.js'
import { getMockExamPreview } from '~api/modules/mock-exams/application/mock-exam-preview.query.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { pauseAttempt } from '~api/modules/mock-exams/application/pause-attempt.command.js'
import { resumeAttempt } from '~api/modules/mock-exams/application/resume-attempt.command.js'
import { saveAttemptAnswer } from '~api/modules/mock-exams/application/save-attempt-answer.command.js'
import { startAttempt } from '~api/modules/mock-exams/application/start-attempt.command.js'
import {
  attemptQuestionConflict,
  attemptQuestionNotFound,
  attemptQuestionWithdrawn,
  failMissingMockExamAttempt,
  failMockExamRead,
  failMockExamWrite,
  invalidAttemptAnswer,
  mockExamAttemptNotInProgress,
  mockExamAttemptPaused,
  mockExamUnavailable,
} from '~api/modules/mock-exams/http/errors.js'
import {
  toMockExamPageDto,
  toAttemptSummaryDto,
  toAttemptReviewQuestionDto,
} from '~api/modules/mock-exams/http/mappers.js'
import {
  toAttemptQuestionDto,
  toMockExamAttemptResponse,
  toNullableMockExamAttemptResponse,
  toMockExamPreviewDto,
} from '~api/modules/mock-exams/http/mappers.js'
import { MockExamReaderLive } from '~api/modules/mock-exams/infrastructure/mock-exam.reader.postgres.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { failStreakRead, failStreakWrite } from '~api/modules/streak/http/errors.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

export const MockExamsLive = HttpApiBuilder.group(Api, 'MockExams', handlers =>
  handlers
    .handle('FinishMockExamAttempt', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            finishAttempt(user.id, params.qualificationPathId, params.attemptId),
          ),
        ),
        Effect.flatMap(toNullableMockExamAttemptResponse),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamAttemptNotInProgress: () => mockExamAttemptNotInProgress,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('AbandonMockExamAttempt', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            abandonAttempt(user.id, params.qualificationPathId, params.attemptId),
          ),
        ),
        Effect.flatMap(toNullableMockExamAttemptResponse),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamAttemptNotInProgress: () => mockExamAttemptNotInProgress,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('PauseMockExamAttempt', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            pauseAttempt(user.id, params.qualificationPathId, params.attemptId),
          ),
        ),
        Effect.flatMap(toNullableMockExamAttemptResponse),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamAttemptNotInProgress: () => mockExamAttemptNotInProgress,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('ResumeMockExamAttempt', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            resumeAttempt(user.id, params.qualificationPathId, params.attemptId),
          ),
        ),
        Effect.flatMap(toNullableMockExamAttemptResponse),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamAttemptNotInProgress: () => mockExamAttemptNotInProgress,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('GetMockExamHistory', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.gen(function* () {
            const user = yield* CurrentUser
            yield* expireUnfinishedAttemptBeforeRead(user.id, params.qualificationPathId)
            const mockExamReader = yield* MockExamReader

            return toMockExamPageDto(
              yield* mockExamReader.history(user.id, params.qualificationPathId, query),
              toAttemptSummaryDto,
            )
          }),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          TransactionError: failTransaction,
          InvalidCursor: () => invalidCursor,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('GetAttemptReview', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.gen(function* () {
            const user = yield* CurrentUser
            yield* expireAttemptBeforeRead(user.id, params.qualificationPathId, params.attemptId)
            const mockExamReader = yield* MockExamReader

            return toMockExamPageDto(
              yield* mockExamReader.review(
                user.id,
                params.qualificationPathId,
                params.attemptId,
                query,
              ),
              toAttemptReviewQuestionDto,
            )
          }),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          TransactionError: failTransaction,
          InvalidCursor: () => invalidCursor,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('GetMockExamPreview', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            expireUnfinishedAttemptBeforeRead(user.id, params.qualificationPathId).pipe(
              Effect.andThen(getMockExamPreview(user.id, params.qualificationPathId)),
            ),
          ),
        ),
        Effect.map(toMockExamPreviewDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('StartMockExamAttempt', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => startAttempt(user.id, params.qualificationPathId)),
        ),
        Effect.flatMap(toMockExamAttemptResponse),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamUnavailable: mockExamUnavailable,
          MockExamAttemptNotFound: failMissingMockExamAttempt,
          TransactionError: failTransaction,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('GetMockExamAttempt', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            expireAttemptBeforeRead(user.id, params.qualificationPathId, params.attemptId).pipe(
              Effect.andThen(
                getMockExamAttempt(user.id, params.qualificationPathId, params.attemptId),
              ),
            ),
          ),
        ),
        Effect.flatMap(toNullableMockExamAttemptResponse),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('GetAttemptQuestion', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            expireAttemptBeforeRead(user.id, params.qualificationPathId, params.attemptId).pipe(
              Effect.andThen(
                getAttemptQuestion(
                  user.id,
                  params.qualificationPathId,
                  params.attemptId,
                  params.position,
                ),
              ),
            ),
          ),
        ),
        Effect.map(Option.map(toAttemptQuestionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamAttemptPaused: () => mockExamAttemptPaused,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('SaveAttemptAnswer', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            saveAttemptAnswer(
              user.id,
              params.qualificationPathId,
              params.attemptId,
              params.position,
              payload,
            ),
          ),
        ),
        Effect.map(toAttemptQuestionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          AttemptQuestionNotFound: () => attemptQuestionNotFound,
          MockExamAttemptNotInProgress: () => mockExamAttemptNotInProgress,
          MockExamAttemptPaused: () => mockExamAttemptPaused,
          AttemptQuestionWithdrawn: () => attemptQuestionWithdrawn,
          InvalidAttemptAnswer: () => invalidAttemptAnswer,
          AttemptQuestionConflict: attemptQuestionConflict,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    )
    .handle('FlagAttemptQuestion', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            flagAttemptQuestion(
              user.id,
              params.qualificationPathId,
              params.attemptId,
              params.position,
              payload,
            ),
          ),
        ),
        Effect.map(toAttemptQuestionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          AttemptQuestionNotFound: () => attemptQuestionNotFound,
          MockExamAttemptNotInProgress: () => mockExamAttemptNotInProgress,
          MockExamAttemptPaused: () => mockExamAttemptPaused,
          AttemptQuestionConflict: attemptQuestionConflict,
          TransactionError: failTransaction,
          PreparationWriteError: failPreparationWrite,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StreakReadError: failStreakRead,
          StreakWriteError: failStreakWrite,
          XpWriteError: failXpWrite,
        }),
      ),
    ),
).pipe(Layer.provide(AuthenticationLive))

export const MockExamsRequestServices = Layer.mergeAll(
  TransactionLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  MockExamReaderLive,
  MockExamRepositoryLive,
  AttemptDeadlineQueueLive,
  StudyReaderLive,
  StudyRepositoryLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
  XpRepositoryLive,
)
