import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import {
  failStudyRead,
  failStudyWrite,
  staleSessionPreview,
} from '~api/modules/learning/http/errors.js'
import {
  pathAccessDenied,
  failPreparationRead,
  failPreparationWrite,
} from '~api/modules/preparation/http/errors.js'
import { getReviewPreview } from '~api/modules/written-study/application/review-preview.query.js'
import { getReviewSession } from '~api/modules/written-study/application/review-session.query.js'
import { startReviewSession } from '~api/modules/written-study/application/start-review-session.command.js'
import {
  documentNotFound,
  studySessionAlreadyStarted,
} from '~api/modules/written-study/http/errors.js'
import { toReviewPreviewDto, toStudySessionDto } from '~api/modules/written-study/http/mappers.js'

export const reviewHandlers = {
  GetReviewPreview: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getReviewPreview(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.documentId),
          ),
        ),
      ),
      Effect.map(Option.map(toReviewPreviewDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  GetReviewSession: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getReviewSession(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.documentId),
          ),
        ),
      ),
      Effect.map(Option.map(toStudySessionDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  StartReviewSession: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          startReviewSession(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(payload.documentId),
            payload.questionCount,
          ),
        ),
      ),
      Effect.map(toStudySessionDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        StudyDocumentNotFound: () => documentNotFound,
        StaleSessionScope: () => staleSessionPreview,
        UnfinishedSessionExists: studySessionAlreadyStarted,
      }),
    ),
} satisfies {
  GetReviewPreview: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetReviewPreview,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetReviewPreview>,
    unknown
  >
  GetReviewSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetReviewSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetReviewSession>,
    unknown
  >
  StartReviewSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.StartReviewSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.StartReviewSession>,
    unknown
  >
}
