import { Schema } from 'effect'

export const questionNoteMaxLength = 2000

/** Empty notes are cleared instead of saved. */
export const QuestionNoteText = Schema.String.check(
  Schema.isMaxLength(questionNoteMaxLength),
  Schema.isPattern(/\S/),
).pipe(Schema.brand('QuestionNoteText'))

export type QuestionNoteText = typeof QuestionNoteText.Type
