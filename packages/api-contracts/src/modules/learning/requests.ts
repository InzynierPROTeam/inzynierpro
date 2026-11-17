import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { Schema } from 'effect'

export const SaveQuestionNotePayload = Schema.Struct({ text: QuestionNoteText })

export type SaveQuestionNotePayload = typeof SaveQuestionNotePayload.Type
