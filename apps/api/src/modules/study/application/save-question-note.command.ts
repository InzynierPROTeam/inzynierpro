import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { QuestionNotOnPath } from '~api/modules/study/domain/errors.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Saves the learner's PersonalQuestionNote on a question of the path (ADR-0002). The note belongs
 * to the question, so it shows on every path the question is on; the text replaces the saved one
 * and the question's current revision is stored with it, so it no longer refers to earlier wording.
 * Saving never records assistance: only opening a saved note before answering does.
 */
export const saveQuestionNote = Effect.fn('Study.saveQuestionNote')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
  text: QuestionNoteText,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository

  if (!(yield* studyReader.isPathQuestion(pathId, questionId))) {
    return yield* new QuestionNotOnPath()
  }

  const note = yield* studyRepository.saveNote(userId, questionId, text)

  return { questionId, note: Option.some(note) }
})
