import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { getAttemptQuestion } from '~api/modules/mock-exams/application/attempt-question.query.js'
import { getMockExamAttempt } from '~api/modules/mock-exams/application/mock-exam-attempt.query.js'
import { getMockExamPreview } from '~api/modules/mock-exams/application/mock-exam-preview.query.js'
import { startAttempt } from '~api/modules/mock-exams/application/start-attempt.command.js'
import {
  failMissingMockExamAttempt,
  failMockExamRead,
  failMockExamWrite,
  mockExamUnavailable,
} from '~api/modules/mock-exams/http/errors.js'
import { toMockExamAttemptDto, toMockExamPreviewDto } from '~api/modules/mock-exams/http/mappers.js'
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
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          MockExamReadError: failMockExamRead,
        }),
      ),
    ),
).pipe(Layer.provide(AuthenticationLive))

export const MockExamsRequestServices = Layer.mergeAll(
  PreparationReaderLive,
  PreparationRepositoryLive,
  MockExamReaderLive,
  MockExamRepositoryLive,
)
