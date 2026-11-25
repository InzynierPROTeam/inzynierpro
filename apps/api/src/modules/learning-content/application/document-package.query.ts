import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { toPackageCandidate } from '~api/modules/learning-content/domain/document-package.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { ReferenceDocumentReader } from './reference-document.reader.js'

export const getDocumentPackageCandidates = Effect.fn(
  'LearningContent.getDocumentPackageCandidates',
)(function* (userId: UserId, pathId: QualificationPathId) {
  yield* requirePathAccess(userId, pathId)

  const referenceDocumentReader = yield* ReferenceDocumentReader
  const documents = yield* referenceDocumentReader.packageDocuments(pathId)

  return documents.map(toPackageCandidate)
})
