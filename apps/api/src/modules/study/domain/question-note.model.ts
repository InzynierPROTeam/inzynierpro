import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { Schema } from 'effect'

/**
 * The learner's PersonalQuestionNote on a question identity, shared across their paths. It keeps
 * the question's revision current at its last edit; once the question's current revision carries
 * other substantive content, the note may refer to earlier wording (ADR-0002).
 */
export const QuestionNote = Schema.Struct({
  text: QuestionNoteText,
  updatedAt: DateTimeUtc,
  refersToEarlierWording: Schema.Boolean,
})

export type QuestionNote = typeof QuestionNote.Type
