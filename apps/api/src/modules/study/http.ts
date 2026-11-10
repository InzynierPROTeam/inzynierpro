import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { PathAccessDenied } from '@inzpro/api-contracts/modules/preparation/errors'
import { DocumentNotFound } from '@inzpro/api-contracts/modules/study/errors'
import { InternalServerError, InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { PreparationReader } from '~api/modules/preparation/preparation.reader.js'
import { PreparationReaderLive } from '~api/modules/preparation/preparation.reader.postgres.js'
import { StudyReader } from '~api/modules/study/study.reader.js'
import { StudyReaderLive } from '~api/modules/study/study.reader.postgres.js'

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
        Effect.flatMap(CurrentUser, user =>
          getDocuments(user.id, params.qualificationPathId, query),
        ).pipe(
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: error =>
              Effect.logError('preparation_read_failed', error).pipe(
                Effect.andThen(
                  Effect.fail(
                    new InternalServerError({
                      type: 'internal_server_error',
                      message: 'Could not read preparation data.',
                    }),
                  ),
                ),
              ),
            PathPermissionDenied: () =>
              Effect.fail(
                new PathAccessDenied({
                  type: 'path_access_denied',
                  message: 'Your active path does not include this material.',
                }),
              ),
            StudyReadError: error =>
              Effect.logError('study_read_failed', error).pipe(
                Effect.andThen(
                  Effect.fail(
                    new InternalServerError({
                      type: 'internal_server_error',
                      message: 'Could not read study material.',
                    }),
                  ),
                ),
              ),
            InvalidCursor: () =>
              Effect.fail(
                new InvalidRequest({
                  type: 'invalid_request',
                  message: 'Invalid pagination cursor.',
                }),
              ),
          }),
        ),
      )
      .handle('GetSessionPreview', ({ params }) =>
        Effect.flatMap(CurrentUser, user =>
          getSessionPreview(user.id, params.qualificationPathId, params.documentId),
        ).pipe(
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: error =>
              Effect.logError('preparation_read_failed', error).pipe(
                Effect.andThen(
                  Effect.fail(
                    new InternalServerError({
                      type: 'internal_server_error',
                      message: 'Could not read preparation data.',
                    }),
                  ),
                ),
              ),
            PathPermissionDenied: () =>
              Effect.fail(
                new PathAccessDenied({
                  type: 'path_access_denied',
                  message: 'Your active path does not include this material.',
                }),
              ),
            StudyReadError: error =>
              Effect.logError('study_read_failed', error).pipe(
                Effect.andThen(
                  Effect.fail(
                    new InternalServerError({
                      type: 'internal_server_error',
                      message: 'Could not read study material.',
                    }),
                  ),
                ),
              ),
            StudyDocumentNotFound: () =>
              Effect.fail(
                new DocumentNotFound({
                  type: 'document_not_found',
                  message: 'The selected material was not found.',
                }),
              ),
          }),
        ),
      )
      .handle('GetOralMaterials', ({ query, params }) =>
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
            PreparationReadError: error =>
              Effect.logError('preparation_read_failed', error).pipe(
                Effect.andThen(
                  Effect.fail(
                    new InternalServerError({
                      type: 'internal_server_error',
                      message: 'Could not read preparation data.',
                    }),
                  ),
                ),
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
      )
  }),
).pipe(
  Layer.provide(AuthenticationLive),
  Layer.provide(Layer.mergeAll(PreparationReaderLive, StudyReaderLive)),
)
