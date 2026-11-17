import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import { Schema } from 'effect'

export const studyMode = 'study'

export const reviewMode = 'review'

export const favoritesMode = 'favourites'

export const learningModes = [studyMode, reviewMode, favoritesMode] as const

export const LearningMode = Schema.Literals(learningModes)

export type LearningMode = typeof LearningMode.Type

export const againRating = 'again'

export const hardRating = 'hard'

export const goodRating = 'good'

export const reviewRatings = [againRating, hardRating, goodRating] as const

export const ReviewRating = Schema.Literals(reviewRatings)

export type ReviewRating = typeof ReviewRating.Type

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

export type StudyDay = {
  readonly start: DateTimeUtc
  readonly end: DateTimeUtc
}
