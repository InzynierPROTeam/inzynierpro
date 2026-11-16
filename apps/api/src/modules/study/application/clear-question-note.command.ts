import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import type { QuestionNote } from '~api/modules/study/domain/question-note.model.js'

import { StudyRepository } from './study.repository.js'

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
