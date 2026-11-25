import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralQuestionCategoryId = Uuid.pipe(Schema.brand('OralQuestionCategoryId'))

export type OralQuestionCategoryId = typeof OralQuestionCategoryId.Type

export const PathOralCategoryPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('PathOralCategoryPosition'),
)

export type PathOralCategoryPosition = typeof PathOralCategoryPosition.Type
