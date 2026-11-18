import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { BadgeCode } from '@inzpro/domain/modules/learning-xp/badge'
import type { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import type { ExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Data, type DateTime, Option, Schema } from 'effect'
import type { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'

export type RewardTrigger = {
  readonly userId: UserId
  readonly pathId: QualificationPathId
  readonly examSessionId: ExamSessionId
  readonly at: DateTime.Utc
}

export type LearningAchievement = Data.TaggedEnum<{
  CompletedRound: { readonly part: ExamPart; readonly round: LearningRoundNumber }
  StreakReached: { readonly length: StreakLength }
  FinishedSession: {}
  PassedMockExam: {}
}>

export const LearningAchievement = Data.taggedEnum<LearningAchievement>()

export type RoundReward = { readonly part: ExamPart; readonly xp: LearningXp }

export type GrantedBadge = { readonly code: BadgeCode; readonly xp: LearningXp }

export type LearningRewards = {
  readonly roundReward: Option.Option<RoundReward>
  readonly badges: ReadonlyArray<GrantedBadge>
}

export const noLearningRewards: LearningRewards = { roundReward: Option.none(), badges: [] }

export const EarnedBadge = Schema.Struct({ code: BadgeCode, earnedAt: DateTimeUtc })

export type EarnedBadge = typeof EarnedBadge.Type
