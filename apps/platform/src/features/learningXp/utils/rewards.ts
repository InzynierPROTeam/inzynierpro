import type { LearningRewards } from '@inzpro/api-contracts/modules/learning-xp/responses'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'

import { badgeNames } from '../config/badges'

type RewardToast = {
  readonly type: 'success'
  readonly title: string
  readonly description: string
}

export const learningRewardToasts = ({
  roundReward,
  badges,
}: LearningRewards): ReadonlyArray<RewardToast> => [
  ...(roundReward === null
    ? []
    : [
        {
          type: 'success' as const,
          title:
            roundReward.part === writtenExamAccess
              ? 'Ukończono rundę nauki pisemnej!'
              : 'Ukończono rundę nauki ustnej!',
          description: `+${roundReward.xp} XP`,
        },
      ]),
  ...badges.map(badge => ({
    type: 'success' as const,
    title: `Nowa odznaka: ${badgeNames[badge.code]}`,
    description: `+${badge.xp} XP`,
  })),
]
