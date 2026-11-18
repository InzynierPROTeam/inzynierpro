import type {
  EarnedBadge as EarnedBadgeDto,
  LearningRewards as LearningRewardsDto,
} from '@inzpro/api-contracts/modules/learning-xp/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Option } from 'effect'

import type { EarnedBadge, LearningRewards } from '../domain/learning-reward.model.js'

export const toLearningRewardsDto = (rewards: LearningRewards): LearningRewardsDto => ({
  roundReward: Option.getOrNull(rewards.roundReward),
  badges: rewards.badges,
})

export const toEarnedBadgeDto = (badge: EarnedBadge): EarnedBadgeDto => ({
  code: badge.code,
  earnedAt: dateTimeUtcToUtcIsoDateTime(badge.earnedAt),
})
