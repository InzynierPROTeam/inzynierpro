import { Schema } from 'effect'

export const firstFinishedSessionBadge = 'first_finished_session'
export const streak7Badge = 'streak_7'
export const streak30Badge = 'streak_30'
export const streak100Badge = 'streak_100'
export const firstWrittenRoundBadge = 'first_written_round'
export const firstOralRoundBadge = 'first_oral_round'
export const firstPassedMockExamBadge = 'first_passed_mock_exam'
export const xp1000Badge = 'xp_1000'
export const xp10000Badge = 'xp_10000'

export const badgeCodeValues = [
  firstFinishedSessionBadge,
  streak7Badge,
  streak30Badge,
  streak100Badge,
  firstWrittenRoundBadge,
  firstOralRoundBadge,
  firstPassedMockExamBadge,
  xp1000Badge,
  xp10000Badge,
] as const

export const BadgeCode = Schema.Literals(badgeCodeValues)

export type BadgeCode = typeof BadgeCode.Type
