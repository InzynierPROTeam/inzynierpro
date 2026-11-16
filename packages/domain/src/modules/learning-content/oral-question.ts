import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralQuestionId = Uuid.pipe(Schema.brand('OralQuestionId'))

export type OralQuestionId = typeof OralQuestionId.Type

export const OralRevisionId = Uuid.pipe(Schema.brand('OralRevisionId'))

export type OralRevisionId = typeof OralRevisionId.Type

export const OralCategoryPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('OralCategoryPosition'),
)

export type OralCategoryPosition = typeof OralCategoryPosition.Type
