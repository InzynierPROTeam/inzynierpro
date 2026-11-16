import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { reviewStudySession } from '@inzpro/domain/modules/study/study-session'
import { Effect, type Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { StudyReader } from './study.reader.js'

/** The unfinished review session of the whole path or one document, which its tile resumes. */
export const getReviewSession = Effect.fn('Study.getReviewSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader

  return yield* studyReader.unfinishedSession(userId, pathId, reviewStudySession, documentId)
})
