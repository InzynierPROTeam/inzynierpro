import { questionNoteMaxLength } from '@inzpro/domain/modules/study/question-note'
import { Schema } from 'effect'

export const questionNoteFormSchema = Schema.Struct({
  text: Schema.String.check(
    Schema.isMaxLength(questionNoteMaxLength, {
      message: `Notatka może mieć maksymalnie ${questionNoteMaxLength} znaków.`,
    }),
  ),
})

export type QuestionNoteFormSchema = typeof questionNoteFormSchema.Encoded
