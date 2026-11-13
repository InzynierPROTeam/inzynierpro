import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { PathAccessDenied } from '@inzpro/api-contracts/modules/preparation/errors'
import { DocumentNotFound } from '@inzpro/api-contracts/modules/study/errors'
import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { PreparationReader } from '~api/modules/preparation/preparation.reader.js'
import { PreparationReaderLive } from '~api/modules/preparation/preparation.reader.postgres.js'
import { StudyReader } from '~api/modules/study/study.reader.js'
import { StudyReaderLive } from '~api/modules/study/study.reader.postgres.js'

import { getDocument } from './document.query.js'
import { getDocuments } from './documents.query.js'
import { getOralMaterials } from './oral-materials.query.js'
import { getSessionPreview } from './session-preview.query.js'

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
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
                StudyReadError: logAndFailInternalServerError('Could not read study material.'),
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('GetDocument', ({ params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getDocument(user.id, params.qualificationPathId, params.documentId),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
                StudyReadError: logAndFailInternalServerError('Could not read study material.'),
                StudyDocumentNotFound: () =>
                  Effect.fail(
                    new DocumentNotFound({
                      type: 'document_not_found',
                      message: 'The selected material was not found.',
                    }),
                  ),
              }),
            ),
          ),
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
            ).pipe(
              Effect.map(Option.getOrNull),
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
                StudyReadError: logAndFailInternalServerError('Could not read study material.'),
              }),
            ),
          ),
        ),
      )
      .handle('GetOralMaterials', ({ query, params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getOralMaterials(user.id, params.qualificationPathId, query),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
  }),
).pipe(
  Layer.provide(AuthenticationLive),
  Layer.provide(Layer.mergeAll(PreparationReaderLive, StudyReaderLive)),
)
