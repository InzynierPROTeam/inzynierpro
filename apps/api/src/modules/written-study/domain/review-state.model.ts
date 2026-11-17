import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import type {
  LearningMode,
  LearningEventId,
  ReviewCard,
} from '~api/modules/learning/domain/review-state.model.js'

export const noAssistance = 'none'

export const noteAssistance = 'note'

export const explanationAssistance = 'explanation'

export const assistanceLevels = [noAssistance, noteAssistance, explanationAssistance] as const

export const AssistanceLevel = Schema.Literals(assistanceLevels)

export type AssistanceLevel = typeof AssistanceLevel.Type

export const writtenReviewRulesVersion = 'written-1/fsrs-7'

export type LearningEventContext = {
  readonly mode: LearningMode
  readonly assistance: AssistanceLevel
  readonly answeredAt: DateTimeUtc
}

export type NewReviewState = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly learningEventId: LearningEventId
  readonly rulesVersion: string
  readonly card: ReviewCard
}
