import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { Schema } from 'effect'

export const OralReviewPreviewSearch = Schema.Struct({
  kategoria: Schema.optional(OralQuestionCategoryId),
  'liczba-pytan': Schema.optional(Schema.Int.check(Schema.isGreaterThan(0))),
})
