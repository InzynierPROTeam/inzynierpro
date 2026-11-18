import {
  type BadgeCode,
  firstFinishedSessionBadge,
  firstOralRoundBadge,
  firstPassedMockExamBadge,
  firstWrittenRoundBadge,
  streak100Badge,
  streak30Badge,
  streak7Badge,
  xp10000Badge,
  xp1000Badge,
} from '@inzpro/domain/modules/learning-xp/badge'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { type ExamPart, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Option } from 'effect'
import type { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'

import { LearningAchievement, type RewardTrigger } from './learning-reward.model.js'
import {
  badgeXpReason,
  type BadgeXpAward,
  completedRoundXpReason,
  type XpAward,
} from './learning-xp.model.js'

const completedRoundXp = LearningXp.make(1000)

const badgeXp = LearningXp.make(100)

const streakBadges = [
  { code: streak7Badge, length: 7 },
  { code: streak30Badge, length: 30 },
  { code: streak100Badge, length: 100 },
] as const

const totalXpThresholds = [
  { code: xp1000Badge, total: 1000 },
  { code: xp10000Badge, total: 10_000 },
] as const

export const achievementBadges = (achievement: LearningAchievement) =>
  LearningAchievement.$match(achievement, {
    CompletedRound: ({ part }): ReadonlyArray<BadgeCode> => [
      part === writtenExamAccess ? firstWrittenRoundBadge : firstOralRoundBadge,
    ],
    StreakReached: ({ length }): ReadonlyArray<BadgeCode> =>
      streakBadges.flatMap(badge => (length >= badge.length ? [badge.code] : [])),
    FinishedSession: (): ReadonlyArray<BadgeCode> => [firstFinishedSessionBadge],
    PassedMockExam: (): ReadonlyArray<BadgeCode> => [firstPassedMockExamBadge],
  })

export const reachedStreakAchievements = (streak: Option.Option<StreakLength>) =>
  Option.toArray(Option.map(streak, length => LearningAchievement.StreakReached({ length })))

export const totalXpBadges = (total: LearningXp): ReadonlyArray<BadgeCode> =>
  totalXpThresholds.flatMap(threshold => (total >= threshold.total ? [threshold.code] : []))

export const completedRoundAwardOf = (
  trigger: RewardTrigger,
  part: ExamPart,
  round: LearningRoundNumber,
): XpAward => ({
  reason: completedRoundXpReason,
  userId: trigger.userId,
  pathId: trigger.pathId,
  examSessionId: trigger.examSessionId,
  amount: completedRoundXp,
  awardKey: `round:${trigger.pathId}:${part}:${round}`,
  awardedAt: trigger.at,
})

export const badgeAwardOf = (trigger: RewardTrigger, badgeCode: BadgeCode): BadgeXpAward => ({
  reason: badgeXpReason,
  badgeCode,
  userId: trigger.userId,
  pathId: trigger.pathId,
  examSessionId: trigger.examSessionId,
  amount: badgeXp,
  awardKey: `badge:${badgeCode}`,
  awardedAt: trigger.at,
})
