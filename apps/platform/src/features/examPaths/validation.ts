import { ExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import { Schema } from 'effect'

export const AccessExtensionSearch = Schema.Struct({
  egzamin: ExamPart,
  redirect: Schema.optional(Schema.String),
})
