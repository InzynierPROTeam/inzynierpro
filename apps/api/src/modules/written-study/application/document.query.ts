import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyDocumentNotFound } from '~api/modules/written-study/domain/errors.js'

export const getDocument = Effect.fn('Study.getDocument')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const round = currentLearningRound(yield* studyReader.learningRound(userId, pathId))
  const document = yield* studyReader.document(userId, pathId, round, documentId)

  if (Option.isNone(document)) {
    return yield* new StudyDocumentNotFound()
  }

  return { document: document.value }
})
