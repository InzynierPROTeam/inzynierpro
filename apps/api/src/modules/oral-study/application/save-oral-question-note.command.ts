import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { QuestionNotOnPath } from '~api/modules/learning/domain/errors.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const saveOralQuestionNote = Effect.fn('Study.saveOralQuestionNote')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: OralQuestionId,
  text: QuestionNoteText,
) {
  yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository

  if (!(yield* oralStudyReader.isPathQuestion(pathId, questionId))) {
    return yield* new QuestionNotOnPath()
  }

  const note = yield* oralStudyRepository.saveNote(userId, questionId, text)

  return { questionId, note: Option.some(note) }
})
