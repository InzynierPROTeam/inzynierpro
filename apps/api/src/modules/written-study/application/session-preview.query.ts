import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import {
  currentLearningRound,
  isNewLearningRound,
} from '~api/modules/learning/domain/learning-round.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import {
  type SessionPreview,
  sessionQuestionPool,
  writtenStudySettings,
} from '~api/modules/written-study/domain/session-preview.rules.js'

export const getSessionPreview = Effect.fn('Study.getSessionPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
  fromDocumentId: Option.Option<ReferenceDocumentId>,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const progress = yield* studyReader.learningRound(userId, pathId)
  const round = currentLearningRound(progress)

  const found = yield* Option.match(documentId, {
    onNone: () =>
      studyReader.nextDocument(userId, pathId, {
        round,
        fromDocumentId,
        skipsStartDocument: isNewLearningRound(progress),
      }),
    onSome: id => studyReader.document(userId, pathId, round, id),
  })

  return Option.map(found, (document): SessionPreview => {
    const pool = sessionQuestionPool(document)

    return {
      qualificationPathId: pathId,
      document,
      mode: 'written-study',
      questionSelection: pool.selection,
      availableQuestionCount: pool.questionCount,
      settings: writtenStudySettings(pool.questionCount),
    }
  })
})
