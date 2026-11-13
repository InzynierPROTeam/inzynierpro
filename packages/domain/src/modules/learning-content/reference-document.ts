import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ReferenceDocumentId = Uuid.pipe(Schema.brand('ReferenceDocumentId'))

export type ReferenceDocumentId = typeof ReferenceDocumentId.Type

export const QuestionCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('QuestionCount'),
)

export type QuestionCount = typeof QuestionCount.Type
