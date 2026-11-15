import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

/** The 1-based number of a LearningRound of written regular study on a path (ADR-0002). */
export const LearningRoundNumber = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('LearningRoundNumber'),
)

export type LearningRoundNumber = typeof LearningRoundNumber.Type

/**
 * The stored round of a learner's path with the path's published, non-withdrawn questions and how
 * many of them are covered in that round.
 */
export const LearningRoundProgress = Schema.Struct({
  round: LearningRoundNumber,
  questionCount: QuestionCount,
  coveredQuestionCount: QuestionCount,
})

export type LearningRoundProgress = typeof LearningRoundProgress.Type
