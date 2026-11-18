import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { BadgeCode } from '@inzpro/domain/modules/learning-xp/badge'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { ExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import { Schema } from 'effect'

export const EarnedBadge = Schema.Struct({ code: BadgeCode, earnedAt: UtcIsoDateTime })

export type EarnedBadge = typeof EarnedBadge.Type

export const LearningXpResponse = Schema.Struct({
  total: LearningXp,
  badges: Schema.Array(EarnedBadge),
})

export type LearningXpResponse = typeof LearningXpResponse.Type

export const GrantedBadge = Schema.Struct({ code: BadgeCode, xp: LearningXp })

export type GrantedBadge = typeof GrantedBadge.Type

export const RoundReward = Schema.Struct({ part: ExamPart, xp: LearningXp })

export type RoundReward = typeof RoundReward.Type

// CONTRACT: Only rewards first granted by this request; a retry reports none.
export const LearningRewards = Schema.Struct({
  roundReward: Schema.NullOr(RoundReward),
  badges: Schema.Array(GrantedBadge),
})

export type LearningRewards = typeof LearningRewards.Type
