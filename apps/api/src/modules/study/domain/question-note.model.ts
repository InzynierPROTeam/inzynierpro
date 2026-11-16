import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import { Schema } from 'effect'

export const QuestionNote = Schema.Struct({
  text: QuestionNoteText,
  updatedAt: DateTimeUtc,
  refersToEarlierWording: Schema.Boolean,
})

export type QuestionNote = typeof QuestionNote.Type
