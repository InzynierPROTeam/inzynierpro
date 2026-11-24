import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { getReferenceDocument } from '~api/modules/learning-content/application/reference-document.query.js'
import { getReferenceDocuments } from '~api/modules/learning-content/application/reference-documents.query.js'
import { ReferenceDocumentReaderLive } from '~api/modules/learning-content/infrastructure/reference-document.reader.postgres.js'
import { failPreparationRead, pathAccessDenied } from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'

import { failLearningContentRead, referenceDocumentNotFound } from './errors.js'
import { toReferenceDocumentDto } from './mappers.js'

export const SourcesLive = HttpApiBuilder.group(Api, 'Sources', handlers =>
  handlers
    .handle('GetReferenceDocuments', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getReferenceDocuments(user.id, params.qualificationPathId, query),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('GetReferenceDocument', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getReferenceDocument(user.id, params.qualificationPathId, params.code),
          ),
        ),
        Effect.map(document => ({ document: toReferenceDocumentDto(document) })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
        }),
      ),
    ),
)

export const SourcesRequestServices = Layer.mergeAll(
  PreparationReaderLive,
  ReferenceDocumentReaderLive,
)
