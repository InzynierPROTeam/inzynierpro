import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const studyMode = 'study'
export const reviewMode = 'review'
export const favoritesMode = 'favourites'
export const learningModes = [studyMode, reviewMode, favoritesMode] as const
export const LearningMode = Schema.Literals(learningModes)

export type LearningMode = typeof LearningMode.Type

export const noAssistance = 'none'
export const noteAssistance = 'note'
export const explanationAssistance = 'explanation'
export const assistanceLevels = [noAssistance, noteAssistance, explanationAssistance] as const
export const AssistanceLevel = Schema.Literals(assistanceLevels)

export type AssistanceLevel = typeof AssistanceLevel.Type

export const againRating = 'again'
export const hardRating = 'hard'
export const goodRating = 'good'
export const reviewRatings = [againRating, hardRating, goodRating] as const
export const ReviewRating = Schema.Literals(reviewRatings)

export type ReviewRating = typeof ReviewRating.Type

export const writtenReviewRulesVersion = 'written-1/fsrs-7'

export const newCardState = 0
export const learningCardState = 1
export const reviewCardState = 2
export const relearningCardState = 3

export const cardStates = [
  newCardState,
  learningCardState,
  reviewCardState,
  relearningCardState,
] as const

export const newSchedule = 'new'
export const learningSchedule = 'learning'
export const reviewSchedule = 'review'
export const scheduleStatuses = [newSchedule, learningSchedule, reviewSchedule] as const

export const ReviewCard = Schema.Struct({
  dueAt: DateTimeUtc,
  lastReviewAt: Schema.OptionFromNullOr(DateTimeUtc),
  stability: Schema.Finite,
  stabilityFast: Schema.Finite,
  difficulty: Schema.Finite,
  state: Schema.Literals(cardStates),
  scheduleStatus: Schema.Literals(scheduleStatuses),
  reps: Schema.Int,
  lapses: Schema.Int,
  scheduledDays: Schema.Finite,
  learningStep: Schema.Int,
})

export type ReviewCard = typeof ReviewCard.Type

export const LearningEventId = Uuid.pipe(Schema.brand('LearningEventId'))

export type LearningEventId = typeof LearningEventId.Type

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

export type StudyDay = {
  readonly start: DateTimeUtc
  readonly end: DateTimeUtc
}
