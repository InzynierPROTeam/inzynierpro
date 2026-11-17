import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const clearQuestionNote = Effect.fn('Study.clearQuestionNote')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyRepository = yield* StudyRepository

  yield* studyRepository.clearNote(userId, questionId)

  return { questionId, note: Option.none<QuestionNote>() }
})
