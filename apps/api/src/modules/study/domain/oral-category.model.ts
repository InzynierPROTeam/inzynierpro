import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

export const OralCategoryQuestionPool = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

export type OralCategoryQuestionPool = typeof OralCategoryQuestionPool.Type
