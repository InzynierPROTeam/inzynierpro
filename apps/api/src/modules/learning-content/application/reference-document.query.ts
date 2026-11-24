import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { UnknownReferenceDocument } from '~api/modules/learning-content/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { ReferenceDocumentReader } from './reference-document.reader.js'

export const getReferenceDocument = Effect.fn('LearningContent.getReferenceDocument')(function* (
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

  return document.value
})
