import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import {
  failStudyRead,
  failStudyWrite,
  questionNotFound,
  staleSessionPreview,
} from '~api/modules/learning/http/errors.js'
import {
  pathAccessDenied,
  failPreparationRead,
  failPreparationWrite,
} from '~api/modules/preparation/http/errors.js'
import { getFavoritesPreview } from '~api/modules/written-study/application/favorites-preview.query.js'
import { getFavoritesSession } from '~api/modules/written-study/application/favorites-session.query.js'
import { markFavorite } from '~api/modules/written-study/application/mark-favorite.command.js'
import { startFavoritesSession } from '~api/modules/written-study/application/start-favorites-session.command.js'
import { unmarkFavorite } from '~api/modules/written-study/application/unmark-favorite.command.js'
import {
  documentNotFound,
  studySessionAlreadyStarted,
} from '~api/modules/written-study/http/errors.js'
import {
  toFavoritesPreviewDto,
  toStudySessionDto,
} from '~api/modules/written-study/http/mappers.js'

export const favoritesHandlers = {
  MarkFavoriteQuestion: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          markFavorite(user.id, params.qualificationPathId, params.questionId),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        QuestionNotOnPath: () => questionNotFound,
      }),
    ),
  UnmarkFavoriteQuestion: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          unmarkFavorite(user.id, params.qualificationPathId, params.questionId),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyWriteError: failStudyWrite,
      }),
    ),
  GetFavoritesPreview: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getFavoritesPreview(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.documentId),
          ),
        ),
      ),
      Effect.map(Option.map(toFavoritesPreviewDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  GetFavoritesSession: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getFavoritesSession(
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
  StartFavoritesSession: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          startFavoritesSession(
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
  MarkFavoriteQuestion: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.MarkFavoriteQuestion,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.MarkFavoriteQuestion>,
    unknown
  >
  UnmarkFavoriteQuestion: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.UnmarkFavoriteQuestion,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.UnmarkFavoriteQuestion>,
    unknown
  >
  GetFavoritesPreview: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetFavoritesPreview,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetFavoritesPreview>,
    unknown
  >
  GetFavoritesSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetFavoritesSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetFavoritesSession>,
    unknown
  >
  StartFavoritesSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.StartFavoritesSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.StartFavoritesSession>,
    unknown
  >
}
