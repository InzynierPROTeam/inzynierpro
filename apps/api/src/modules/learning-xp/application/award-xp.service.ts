import type { BadgeCode } from '@inzpro/domain/modules/learning-xp/badge'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Array as Arr, DateTime, Effect, Option } from 'effect'

import {
  type GrantedBadge,
  LearningAchievement,
  type LearningRewards,
  type RewardTrigger,
} from '../domain/learning-reward.model.js'
import {
  achievementBadges,
  badgeAwardOf,
  completedRoundAwardOf,
  totalXpBadges,
} from '../domain/learning-reward.rules.js'
import {
  allTimeXpPeriod,
  type DailyXpAwardLimit,
  type XpAward,
} from '../domain/learning-xp.model.js'
import { xpPeriodsOf } from '../domain/learning-xp.rules.js'
import { XpReader } from './learning-xp.reader.js'
import { XpRepository } from './learning-xp.repository.js'

const addToPeriodTotals = Effect.fn('LearningXp.addToPeriodTotals')(function* (award: XpAward) {
  const xpRepository = yield* XpRepository
  const reachedAt = yield* DateTime.now

  for (const period of xpPeriodsOf(award)) {
    yield* xpRepository.addPeriodXp(award, period, reachedAt)
  }
})

export const awardXp = Effect.fn('LearningXp.awardXp')(function* (
  award: XpAward,
  dailyLimit?: DailyXpAwardLimit,
) {
  const xpRepository = yield* XpRepository

  if (!(yield* xpRepository.recordAward(award, dailyLimit))) {
    return LearningXp.make(0)
  }

  yield* addToPeriodTotals(award)

  return award.amount
})

const grantBadges = Effect.fn('LearningXp.grantBadges')(function* (
  trigger: RewardTrigger,
  codes: ReadonlyArray<BadgeCode>,
) {
  const xpRepository = yield* XpRepository
  const granted: Array<GrantedBadge> = []

  for (const code of codes) {
    const award = badgeAwardOf(trigger, code)

    if (yield* xpRepository.recordBadge(award)) {
      yield* addToPeriodTotals(award)
      granted.push({ code, xp: award.amount })
    }
  }

  return granted
})

const grantTotalXpBadges = Effect.fn('LearningXp.grantTotalXpBadges')(function* (
  trigger: RewardTrigger,
) {
  const xpReader = yield* XpReader
  const granted: Array<GrantedBadge> = []
  let grantedMore = true

  while (grantedMore) {
    const total = yield* xpReader.periodTotal(trigger.userId, allTimeXpPeriod)

    const reached = yield* grantBadges(
      trigger,
      Option.match(total, { onNone: () => [], onSome: reached => totalXpBadges(reached.total) }),
    )

    granted.push(...reached)
    grantedMore = reached.length > 0
  }

  return granted
})

export const grantLearningRewards = Effect.fn('LearningXp.grantLearningRewards')(function* (
  trigger: RewardTrigger,
  achievements: ReadonlyArray<LearningAchievement>,
) {
  const completedRound = Arr.findFirst(achievements, LearningAchievement.$is('CompletedRound'))
  let roundReward: LearningRewards['roundReward'] = Option.none()

  if (Option.isSome(completedRound)) {
    const { part, round } = completedRound.value
    const awarded = yield* awardXp(completedRoundAwardOf(trigger, part, round))
    roundReward = awarded > 0 ? Option.some({ part, xp: awarded }) : Option.none()
  }

  const badges = yield* grantBadges(trigger, achievements.flatMap(achievementBadges))

  const rewards: LearningRewards = {
    roundReward,
    badges: [...badges, ...(yield* grantTotalXpBadges(trigger))],
  }

  return rewards
})
