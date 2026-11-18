import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  type BridgeCount,
  DailyAnswerCount,
  StreakLength,
} from '@inzpro/domain/modules/streak/streak'
import { type DateTime, Schema } from 'effect'

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
  readonly bridgeCount: BridgeCount
  readonly bridgeLimit: BridgeCount
  readonly pendingBridgeCount: BridgeCount
}

export const streakMilestoneBridge = 'streak_milestone'
export const passedMockExamBridge = 'passed_mock_exam'
export const completedRoundBridge = 'completed_round'
export const missedDayBridge = 'missed_day'

export const streakBridgeReasonValues = [
  streakMilestoneBridge,
  passedMockExamBridge,
  completedRoundBridge,
  missedDayBridge,
] as const

export const StreakBridgeReason = Schema.Literals(streakBridgeReasonValues)

export type StreakBridgeReason = typeof StreakBridgeReason.Type

export type StreakBridgeGrant = {
  readonly key: string
  readonly reason: Exclude<StreakBridgeReason, typeof missedDayBridge>
  readonly studyDay: DateTime.Utc
  readonly bridgeCount: BridgeCount
}

export type StreakBridgeEvent = {
  readonly key: string
  readonly reason: StreakBridgeReason
  readonly studyDay: DateTime.Utc
  readonly bridgeChange: number
}
