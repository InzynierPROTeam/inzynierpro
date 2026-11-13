import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'

import { StudyDocumentNotFound } from './errors.js'
import { StudyReader } from './study.reader.js'

export const getDocument = Effect.fn('Study.getDocument')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const document = yield* studyReader.document(userId, pathId, documentId)

  if (Option.isNone(document)) {
    return yield* new StudyDocumentNotFound()
  }

  return { document: document.value }
})
