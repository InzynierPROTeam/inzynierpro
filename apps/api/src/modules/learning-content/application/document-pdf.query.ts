import type { UserId } from '@inzpro/domain/modules/identity/user'
import { metadataOnlyAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, Duration, Effect, Option } from 'effect'
import {
  DocumentDownloadNotAllowed,
  ReferenceDocumentPdfUnavailable,
  UnknownReferenceDocument,
} from '~api/modules/learning-content/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { ContentAssetReader } from './content-asset.reader.js'
import { FileStorage } from './file-storage.service.js'
import { ReferenceDocumentReader } from './reference-document.reader.js'

const documentPdfAddressLifetime = Duration.hours(1)

const pdfLocation = Effect.fn('LearningContent.pdfLocation')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  code: ReferenceDocumentCode,
) {
  yield* requirePathAccess(userId, pathId)

  const referenceDocumentReader = yield* ReferenceDocumentReader
  const contentAssetReader = yield* ContentAssetReader
  const document = yield* referenceDocumentReader.pathDocument(pathId, code)

  if (Option.isNone(document)) {
    return yield* new UnknownReferenceDocument()
  }

  const { edition } = document.value

  if (edition.availability === metadataOnlyAvailability || Option.isNone(edition.pdfAssetId)) {
    return yield* new ReferenceDocumentPdfUnavailable()
  }

  const location = Arr.head(yield* contentAssetReader.locations([edition.pdfAssetId.value]))

  if (Option.isNone(location)) {
    return yield* new ReferenceDocumentPdfUnavailable()
  }

  return { document: document.value, storageKey: location.value.storageKey }
})

export const getDocumentPdfUrl = Effect.fn('LearningContent.getDocumentPdfUrl')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  code: ReferenceDocumentCode,
) {
  const { storageKey } = yield* pdfLocation(userId, pathId, code)
  const fileStorage = yield* FileStorage

  return yield* fileStorage.signedGetUrl(storageKey, documentPdfAddressLifetime)
})

export const getDocumentPdfDownloadUrl = Effect.fn('LearningContent.getDocumentPdfDownloadUrl')(
  function* (userId: UserId, pathId: QualificationPathId, code: ReferenceDocumentCode) {
    const { document, storageKey } = yield* pdfLocation(userId, pathId, code)

    if (!document.edition.downloadable) {
      return yield* new DocumentDownloadNotAllowed()
    }

    const fileStorage = yield* FileStorage

    return yield* fileStorage.signedDownloadUrl(
      storageKey,
      documentPdfAddressLifetime,
      `${document.code}.pdf`,
    )
  },
)
