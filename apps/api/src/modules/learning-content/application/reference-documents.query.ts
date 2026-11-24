import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { ReferenceDocumentReader } from './reference-document.reader.js'

export const getReferenceDocuments = Effect.fn('LearningContent.getReferenceDocuments')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId)

  const referenceDocumentReader = yield* ReferenceDocumentReader

  return yield* referenceDocumentReader.pathDocuments(pathId, page)
})
