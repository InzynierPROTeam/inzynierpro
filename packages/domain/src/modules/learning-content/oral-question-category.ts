import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralQuestionCategoryId = Uuid.pipe(Schema.brand('OralQuestionCategoryId'))

export type OralQuestionCategoryId = typeof OralQuestionCategoryId.Type

export const OralQuestionCategorySortOrder = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0),
).pipe(Schema.brand('OralQuestionCategorySortOrder'))

export type OralQuestionCategorySortOrder = typeof OralQuestionCategorySortOrder.Type
