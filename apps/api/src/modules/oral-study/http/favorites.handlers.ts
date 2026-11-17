import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import {
  questionNotFound,
  failStudyRead,
  failStudyWrite,
  staleSessionPreview,
} from '~api/modules/learning/http/errors.js'
import { markOralFavorite } from '~api/modules/oral-study/application/mark-oral-favorite.command.js'
import {
  getOralFavoritesPreview,
  getOralFavoritesSession,
} from '~api/modules/oral-study/application/oral-favorites-preview.query.js'
import { startOralFavoritesSession } from '~api/modules/oral-study/application/start-oral-favorites-session.command.js'
import { unmarkOralFavorite } from '~api/modules/oral-study/application/unmark-oral-favorite.command.js'
import { oralSessionAlreadyStarted } from '~api/modules/oral-study/http/errors.js'
import { toOralStudySessionDto } from '~api/modules/oral-study/http/mappers.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'

export const favoritesHandlers = {
  UnmarkOralFavoriteQuestion: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          unmarkOralFavorite(user.id, params.qualificationPathId, params.questionId),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyWriteError: failStudyWrite,
      }),
    ),
  MarkOralFavoriteQuestion: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          markOralFavorite(user.id, params.qualificationPathId, params.questionId),
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
  GetOralFavoritesPreview: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralFavoritesPreview(user.id, params.qualificationPathId),
        ),
      ),
      Effect.map(result => ({ ...result, settings: Option.getOrNull(result.settings) })),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  GetOralFavoritesSession: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralFavoritesSession(user.id, params.qualificationPathId),
        ),
      ),
      Effect.map(Option.map(toOralStudySessionDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  StartOralFavoritesSession: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          startOralFavoritesSession(user.id, params.qualificationPathId, payload.questionCount),
        ),
      ),
      Effect.map(toOralStudySessionDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        PreparationWriteError: failPreparationWrite,
        StudyWriteError: failStudyWrite,
        StaleSessionScope: () => staleSessionPreview,
        UnfinishedOralSessionExists: oralSessionAlreadyStarted,
      }),
    ),
} satisfies {
  UnmarkOralFavoriteQuestion: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.UnmarkOralFavoriteQuestion,
    HttpApiEndpoint.MiddlewareError<
      typeof Api.groups.OralStudy.endpoints.UnmarkOralFavoriteQuestion
    >,
    unknown
  >
  MarkOralFavoriteQuestion: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.MarkOralFavoriteQuestion,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.MarkOralFavoriteQuestion>,
    unknown
  >
  GetOralFavoritesPreview: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralFavoritesPreview,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralFavoritesPreview>,
    unknown
  >
  GetOralFavoritesSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralFavoritesSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralFavoritesSession>,
    unknown
  >
  StartOralFavoritesSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.StartOralFavoritesSession,
    HttpApiEndpoint.MiddlewareError<
      typeof Api.groups.OralStudy.endpoints.StartOralFavoritesSession
    >,
    unknown
  >
}
