import { BridgeCount, DailyAnswerCount, StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Schema } from 'effect'

export const Streak = Schema.Struct({
  // CONTRACT: Qualifying Europe/Warsaw days of the run ending at the last qualifying day, while today can still continue it directly or through held bridges; otherwise 0. Bridged days add nothing.
  currentStreak: StreakLength,
  longestStreak: StreakLength,
  todayAnswerCount: DailyAnswerCount,
  dailyAnswerThreshold: DailyAnswerCount,
  todayQualifies: Schema.Boolean,
  bridgeCount: BridgeCount,
  bridgeLimit: BridgeCount,
  // CONTRACT: Bridges that qualifying today would spend on the missed days since the last qualifying day.
  pendingBridgeCount: BridgeCount,
})

export type Streak = typeof Streak.Type
