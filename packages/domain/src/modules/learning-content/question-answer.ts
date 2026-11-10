import { Schema } from 'effect'
import { ApiDateTime } from '~domain/common/date-time.js'
import { Uuid } from '~domain/common/id.js'
import { QuestionRevisionId } from '~domain/modules/learning-content/written-question.js'

export const QuestionAnswerId = Uuid.pipe(Schema.brand('QuestionAnswerId'))

export type QuestionAnswerId = typeof QuestionAnswerId.Type

export const QuestionAnswer = Schema.Struct({
  id: QuestionAnswerId,
  questionRevisionId: QuestionRevisionId,
  text: Schema.NonEmptyString,
  isCorrect: Schema.Boolean,
  createdAt: ApiDateTime,
})

export type QuestionAnswer = typeof QuestionAnswer.Type
