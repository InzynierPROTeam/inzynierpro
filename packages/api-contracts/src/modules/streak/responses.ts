import { DailyAnswerCount, StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Schema } from 'effect'

export const Streak = Schema.Struct({
  // CONTRACT: Consecutive qualifying Europe/Warsaw days ending today, or ending yesterday while today has not qualified yet; otherwise 0.
  currentStreak: StreakLength,
  longestStreak: StreakLength,
  todayAnswerCount: DailyAnswerCount,
  dailyAnswerThreshold: DailyAnswerCount,
  todayQualifies: Schema.Boolean,
})

export type Streak = typeof Streak.Type
