import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { Context, DateTime, Effect, Layer, Option } from 'effect'
import { DefaultScheduler, Rating } from 'ts-fsrs'
import {
  againRating,
  goodRating,
  hardRating,
  type ReviewCard,
  type ReviewRating,
} from '~api/modules/learning/domain/review-state.model.js'

const grades = {
  [againRating]: Rating.Again,
  [hardRating]: Rating.Hard,
  [goodRating]: Rating.Good,
} as const

export class ReviewScheduler extends Context.Service<
  ReviewScheduler,
  {
    readonly review: (
      questionId: WrittenQuestionId | OralQuestionId,
      card: Option.Option<ReviewCard>,
      rating: ReviewRating,
      at: DateTime.Utc,
    ) => ReviewCard
  }
>()('api/modules/study/ReviewScheduler') {}

export const ReviewSchedulerLive = Layer.effect(
  ReviewScheduler,
  Effect.promise(() => DefaultScheduler({ desiredRetention: 0.9, enableFuzz: false })).pipe(
    Effect.map(scheduler =>
      ReviewScheduler.of({
        review: (questionId, card, rating, at) => {
          const now = DateTime.toDate(at)

          const current = Option.match(card, {
            onNone: () => scheduler.newCard({ now, cardId: questionId }),
            onSome: stored => ({
              ...stored,
              cardId: questionId,
              dueAt: DateTime.toDate(stored.dueAt),
              lastReviewAt: Option.map(stored.lastReviewAt, DateTime.toDate).pipe(Option.getOrNull),
            }),
          })

          const { card: next } = scheduler.review({ card: current, grade: grades[rating], now })

          return {
            dueAt: DateTime.fromDateUnsafe(next.dueAt),
            lastReviewAt: Option.fromNullishOr(next.lastReviewAt).pipe(
              Option.map(DateTime.fromDateUnsafe),
            ),
            stability: next.stability,
            stabilityFast: next.stabilityFast,
            difficulty: next.difficulty,
            state: next.state,
            scheduleStatus: next.scheduleStatus,
            reps: next.reps,
            lapses: next.lapses,
            scheduledDays: next.scheduledDays,
            learningStep: next.learningStep,
          }
        },
      }),
    ),
  ),
)
