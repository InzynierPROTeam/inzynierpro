import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failStudyRead } from '~api/modules/learning/http/errors.js'
import { pathAccessDenied, failPreparationRead } from '~api/modules/preparation/http/errors.js'
import { getDocument } from '~api/modules/written-study/application/document.query.js'
import { getDocuments } from '~api/modules/written-study/application/documents.query.js'
import { getSessionPreview } from '~api/modules/written-study/application/session-preview.query.js'
import { documentNotFound } from '~api/modules/written-study/http/errors.js'

export const materialHandlers = {
  GetDocuments: ({ query, params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getDocuments(user.id, params.qualificationPathId, query),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        InvalidCursor: () => invalidCursor,
      }),
    ),
  GetDocument: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getDocument(user.id, params.qualificationPathId, params.documentId),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyDocumentNotFound: () => documentNotFound,
      }),
    ),
  GetSessionPreview: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getSessionPreview(
            user.id,
            params.qualificationPathId,
            Option.fromNullishOr(query.documentId),
            Option.fromNullishOr(query.fromDocumentId),
          ),
        ),
      ),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
} satisfies {
  GetDocuments: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetDocuments,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetDocuments>,
    unknown
  >
  GetDocument: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetDocument,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetDocument>,
    unknown
  >
  GetSessionPreview: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetSessionPreview,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetSessionPreview>,
    unknown
  >
}
