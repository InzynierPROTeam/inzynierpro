import type { UserId } from '@inzpro/domain/modules/identity/user'
import { fullContentAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import {
  ReferenceDocumentTextUnavailable,
  UnknownReferenceDocument,
} from '~api/modules/learning-content/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { ReferenceDocumentReader } from './reference-document.reader.js'

export const getDocumentSections = Effect.fn('LearningContent.getDocumentSections')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  code: ReferenceDocumentCode,
) {
  yield* requirePathAccess(userId, pathId)

  const referenceDocumentReader = yield* ReferenceDocumentReader
  const document = yield* referenceDocumentReader.pathDocument(pathId, code)

  if (Option.isNone(document)) {
    return yield* new UnknownReferenceDocument()
  }

  if (document.value.edition.availability !== fullContentAvailability) {
    return yield* new ReferenceDocumentTextUnavailable()
  }

  return yield* referenceDocumentReader.editionSections(document.value.edition.id)
})
