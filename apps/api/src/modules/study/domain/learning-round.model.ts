import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

/** The 1-based number of a LearningRound of written regular study on a path (ADR-0002). */
export const LearningRoundNumber = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('LearningRoundNumber'),
)

export type LearningRoundNumber = typeof LearningRoundNumber.Type

/** Counts only published, non-withdrawn questions on the path. */
export const LearningRoundProgress = Schema.Struct({
  round: LearningRoundNumber,
  questionCount: QuestionCount,
  coveredQuestionCount: QuestionCount,
})

export type LearningRoundProgress = typeof LearningRoundProgress.Type
