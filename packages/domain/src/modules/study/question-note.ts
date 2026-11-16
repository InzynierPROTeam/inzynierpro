import { Schema } from 'effect'

/** The longest PersonalQuestionNote the learner can keep: about a page of plain text. */
export const questionNoteMaxLength = 2000

/**
 * The plain text of a PersonalQuestionNote: up to `questionNoteMaxLength` characters with at
 * least one that is not whitespace. A note without any text is cleared instead of saved.
 */
export const QuestionNoteText = Schema.String.check(
  Schema.isMaxLength(questionNoteMaxLength),
  Schema.isPattern(/\S/),
).pipe(Schema.brand('QuestionNoteText'))

export type QuestionNoteText = typeof QuestionNoteText.Type
