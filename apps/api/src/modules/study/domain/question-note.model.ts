import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { Schema } from 'effect'

/** Shared across paths; refersToEarlierWording compares substantive content at the last edit (ADR-0002). */
export const QuestionNote = Schema.Struct({
  text: QuestionNoteText,
  updatedAt: DateTimeUtc,
  refersToEarlierWording: Schema.Boolean,
})

export type QuestionNote = typeof QuestionNote.Type
