import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction, TransactionLive } from '~api/lib/transaction.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { getAttemptQuestion } from '~api/modules/mock-exams/application/attempt-question.query.js'
import { flagAttemptQuestion } from '~api/modules/mock-exams/application/flag-attempt-question.command.js'
import { getMockExamAttempt } from '~api/modules/mock-exams/application/mock-exam-attempt.query.js'
import { getMockExamPreview } from '~api/modules/mock-exams/application/mock-exam-preview.query.js'
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
  mockExamUnavailable,
} from '~api/modules/mock-exams/http/errors.js'
import {
  toAttemptQuestionDto,
  toMockExamAttemptDto,
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

export const MockExamsLive = HttpApiBuilder.group(Api, 'MockExams', handlers =>
  handlers
    .handle('GetMockExamPreview', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getMockExamPreview(user.id, params.qualificationPathId),
          ),
        ),
        Effect.map(toMockExamPreviewDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
        }),
      ),
    )
    .handle('StartMockExamAttempt', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => startAttempt(user.id, params.qualificationPathId)),
        ),
        Effect.map(toMockExamAttemptDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
          MockExamWriteError: failMockExamWrite,
          MockExamUnavailable: mockExamUnavailable,
          MockExamAttemptNotFound: failMissingMockExamAttempt,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('GetMockExamAttempt', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getMockExamAttempt(user.id, params.qualificationPathId, params.attemptId),
          ),
        ),
        Effect.map(Option.map(toMockExamAttemptDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
        }),
      ),
    )
    .handle('GetAttemptQuestion', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getAttemptQuestion(
              user.id,
              params.qualificationPathId,
              params.attemptId,
              params.position,
            ),
          ),
        ),
        Effect.map(Option.map(toAttemptQuestionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
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
          AttemptQuestionWithdrawn: () => attemptQuestionWithdrawn,
          InvalidAttemptAnswer: () => invalidAttemptAnswer,
          AttemptQuestionConflict: attemptQuestionConflict,
          TransactionError: failTransaction,
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
          AttemptQuestionConflict: attemptQuestionConflict,
          TransactionError: failTransaction,
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
)
