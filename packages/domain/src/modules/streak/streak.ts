import { Schema } from 'effect'

export const StreakLength = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('StreakLength'),
)

export type StreakLength = typeof StreakLength.Type

export const DailyAnswerCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('DailyAnswerCount'),
)

export type DailyAnswerCount = typeof DailyAnswerCount.Type
