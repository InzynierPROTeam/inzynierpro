import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

/**
 * An oral category with the learner's coverage of its published, non-withdrawn questions assigned
 * to the path.
 */
export const OralCategoryQuestionPool = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

export type OralCategoryQuestionPool = typeof OralCategoryQuestionPool.Type
