import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { PreparationReader } from '~api/modules/preparation/application/preparation.reader.js'
import { pathAccessDenied, failPreparationRead } from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { getDocument } from '~api/modules/study/application/document.query.js'
import { getDocuments } from '~api/modules/study/application/documents.query.js'
import { getOralMaterials } from '~api/modules/study/application/oral-materials.query.js'
import { getSessionPreview } from '~api/modules/study/application/session-preview.query.js'
import { StudyReader } from '~api/modules/study/application/study.reader.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'

import { documentNotFound, failStudyRead } from './errors.js'

export const StudyLive = HttpApiBuilder.group(Api, 'Study', handlers =>
  Effect.gen(function* () {
    const preparationReader = yield* PreparationReader
    const studyReader = yield* StudyReader

    const dependencies = Layer.mergeAll(
      Layer.succeed(PreparationReader, preparationReader),
      Layer.succeed(StudyReader, studyReader),
    )

    return handlers
      .handle('GetDocuments', ({ query, params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getDocuments(user.id, params.qualificationPathId, query),
            ),
          ),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PathPermissionDenied: () => pathAccessDenied,
            StudyReadError: failStudyRead,
            InvalidCursor: () => invalidCursor,
          }),
        ),
      )
      .handle('GetDocument', ({ params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getDocument(user.id, params.qualificationPathId, params.documentId),
            ),
          ),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PathPermissionDenied: () => pathAccessDenied,
            StudyReadError: failStudyRead,
            StudyDocumentNotFound: () => documentNotFound,
          }),
        ),
      )
      .handle('GetSessionPreview', ({ params, query }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getSessionPreview(
                user.id,
                params.qualificationPathId,
                Option.fromNullishOr(query.documentId),
                Option.fromNullishOr(query.afterDocumentId),
              ),
            ),
          ),
          Effect.map(Option.getOrNull),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PathPermissionDenied: () => pathAccessDenied,
            StudyReadError: failStudyRead,
          }),
        ),
      )
      .handle('GetOralMaterials', ({ query, params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getOralMaterials(user.id, params.qualificationPathId, query),
            ),
          ),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PathPermissionDenied: () => pathAccessDenied,
            InvalidCursor: () => invalidCursor,
          }),
        ),
      )
  }),
).pipe(
  Layer.provide(AuthenticationLive),
  Layer.provide(Layer.mergeAll(PreparationReaderLive, StudyReaderLive)),
)
