import { Schema } from 'effect'

export const questionNoteMaxLength = 2000

export const QuestionNoteText = Schema.String.check(
  Schema.isMaxLength(questionNoteMaxLength),
  Schema.isPattern(/\S/),
).pipe(Schema.brand('QuestionNoteText'))

export type QuestionNoteText = typeof QuestionNoteText.Type
