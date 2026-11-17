import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const clearOralQuestionNote = Effect.fn('Study.clearOralQuestionNote')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: OralQuestionId,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyRepository = yield* OralStudyRepository

  yield* oralStudyRepository.clearNote(userId, questionId)

  return { questionId, note: Option.none<QuestionNote>() }
})
