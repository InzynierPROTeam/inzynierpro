import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { pathOralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failStudyRead } from '~api/modules/learning/http/errors.js'
import { getOralMaterials } from '~api/modules/oral-study/application/oral-materials.query.js'
import { getOralSessionPreview } from '~api/modules/oral-study/application/oral-session-preview.query.js'
import { districtChamberNotChosen } from '~api/modules/oral-study/http/errors.js'
import { toOralSessionPreviewDto } from '~api/modules/oral-study/http/mappers.js'
import { failPreparationRead, pathAccessDenied } from '~api/modules/preparation/http/errors.js'

export const materialHandlers = {
  GetOralMaterials: ({ query, params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralMaterials(user.id, params.qualificationPathId, query),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        InvalidCursor: () => invalidCursor,
        StudyReadError: failStudyRead,
      }),
    ),
  GetOralSessionPreview: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralSessionPreview(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.categoryId),
            Option.fromNullishOr(query.fromCategoryId),
            query.questionScope ?? pathOralQuestionScope,
          ),
        ),
      ),
      Effect.map(Option.map(toOralSessionPreviewDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        DistrictChamberNotChosen: () => districtChamberNotChosen,
      }),
    ),
} satisfies {
  GetOralMaterials: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralMaterials,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralMaterials>,
    unknown
  >
  GetOralSessionPreview: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSessionPreview,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSessionPreview>,
    unknown
  >
}
