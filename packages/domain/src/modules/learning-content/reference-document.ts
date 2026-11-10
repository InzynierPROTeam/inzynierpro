import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ReferenceDocumentId = Uuid.pipe(Schema.brand('ReferenceDocumentId'))

export type ReferenceDocumentId = typeof ReferenceDocumentId.Type

export const ReferenceDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export type ReferenceDocument = typeof ReferenceDocument.Type

export const QuestionCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('QuestionCount'),
)

export type QuestionCount = typeof QuestionCount.Type

export const DocumentQuestionPool = Schema.Struct({
  ...ReferenceDocument.fields,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

export type DocumentQuestionPool = typeof DocumentQuestionPool.Type
