import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { pathOralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import {
  failStudyRead,
  failStudyWrite,
  staleSessionPreview,
} from '~api/modules/learning/http/errors.js'
import {
  getOralReviewPreview,
  getOralReviewSession,
} from '~api/modules/oral-study/application/oral-review-preview.query.js'
import { startOralReviewSession } from '~api/modules/oral-study/application/start-oral-review-session.command.js'
import {
  districtChamberNotChosen,
  oralCategoryNotFound,
  oralSessionAlreadyStarted,
} from '~api/modules/oral-study/http/errors.js'
import {
  toOralReviewPreviewDto,
  toOralStudySessionDto,
} from '~api/modules/oral-study/http/mappers.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'

export const reviewHandlers = {
  GetOralReviewPreview: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralReviewPreview(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.categoryId),
            query.questionScope ?? pathOralQuestionScope,
          ),
        ),
      ),
      Effect.map(Option.map(toOralReviewPreviewDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        DistrictChamberNotChosen: () => districtChamberNotChosen,
      }),
    ),
  GetOralReviewSession: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralReviewSession(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.categoryId),
          ),
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
  StartOralReviewSession: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          startOralReviewSession(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(payload.categoryId),
            payload.questionCount,
            payload.questionScope ?? pathOralQuestionScope,
          ),
        ),
      ),
      Effect.map(toOralStudySessionDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        DistrictChamberNotChosen: () => districtChamberNotChosen,
        StudyWriteError: failStudyWrite,
        OralCategoryNotOnPath: () => oralCategoryNotFound,
        StaleSessionScope: () => staleSessionPreview,
        UnfinishedOralSessionExists: oralSessionAlreadyStarted,
      }),
    ),
} satisfies {
  GetOralReviewPreview: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralReviewPreview,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralReviewPreview>,
    unknown
  >
  GetOralReviewSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralReviewSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralReviewSession>,
    unknown
  >
  StartOralReviewSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.StartOralReviewSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.StartOralReviewSession>,
    unknown
  >
}
