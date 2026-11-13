import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'
import { writtenStudySettings } from '~api/modules/study/session-preview.rules.js'

import { StudyReader } from './study.reader.js'

// Preview does not create a StudySession.
export const getSessionPreview = Effect.fn('Study.getSessionPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
  afterDocumentId: Option.Option<ReferenceDocumentId>,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader

  const found = yield* Option.match(documentId, {
    onNone: () => studyReader.nextDocument(userId, pathId, afterDocumentId),
    onSome: id => studyReader.document(userId, pathId, id),
  })

  return Option.map(found, document => ({
    qualificationPathId: pathId,
    document,
    mode: 'written-study' as const,
    availableQuestionCount: document.availableQuestionCount,
    settings: writtenStudySettings(document.availableQuestionCount),
  }))
})
