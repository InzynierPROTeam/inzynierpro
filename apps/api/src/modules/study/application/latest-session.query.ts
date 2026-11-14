import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, type Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { StudyReader } from './study.reader.js'

/**
 * The learner's most recently started written session on the path, or on one document of it. A
 * document has at most one unfinished session, and it is always the latest one.
 */
export const getLatestSession = Effect.fn('Study.getLatestSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader

  return yield* studyReader.latestSession(userId, pathId, documentId)
})
