import { questionNoteMaxLength } from '@inzpro/domain/modules/study/question-note'
import { Schema } from 'effect'

// An empty note is cleared rather than refused, so only the length is checked here.
export const questionNoteFormSchema = Schema.Struct({
  text: Schema.String.check(
    Schema.isMaxLength(questionNoteMaxLength, {
      message: `Notatka może mieć maksymalnie ${questionNoteMaxLength} znaków.`,
    }),
  ),
})

export type QuestionNoteFormSchema = typeof questionNoteFormSchema.Encoded
