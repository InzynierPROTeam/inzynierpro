import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

export const LearningRoundNumber = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('LearningRoundNumber'),
)

export type LearningRoundNumber = typeof LearningRoundNumber.Type

export const LearningRoundProgress = Schema.Struct({
  round: LearningRoundNumber,
  questionCount: QuestionCount,
  coveredQuestionCount: QuestionCount,
})

export type LearningRoundProgress = typeof LearningRoundProgress.Type
