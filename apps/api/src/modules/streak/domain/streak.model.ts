import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { DailyAnswerCount, StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Schema } from 'effect'

export const StreakRecord = Schema.Struct({
  currentStreak: StreakLength,
  longestStreak: StreakLength,
  lastQualifyingDay: DateTimeUtc,
})

export type StreakRecord = typeof StreakRecord.Type

export const DailyActivity = Schema.Struct({
  answerCount: DailyAnswerCount,
  isQualifying: Schema.Boolean,
})

export type DailyActivity = typeof DailyActivity.Type

export type Streak = {
  readonly currentStreak: StreakLength
  readonly longestStreak: StreakLength
  readonly todayAnswerCount: DailyAnswerCount
  readonly dailyAnswerThreshold: DailyAnswerCount
  readonly todayQualifies: boolean
}
