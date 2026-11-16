import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { QuestionNotOnPath } from '~api/modules/study/domain/errors.js'

import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'

export const saveOralQuestionNote = Effect.fn('Study.saveOralQuestionNote')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: OralQuestionId,
  text: QuestionNoteText,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository

  if (!(yield* oralStudyReader.isPathQuestion(pathId, questionId))) {
    return yield* new QuestionNotOnPath()
  }

  const note = yield* oralStudyRepository.saveNote(userId, questionId, text)

  return { questionId, note: Option.some(note) }
})
