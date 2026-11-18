import type { GetStreakRequest } from '@inzpro/api-client/modules/streak'
import type { UserId } from '@inzpro/domain/modules/identity/user'

export const streakKeys = {
  all: ['streak'] as const,
  account: (userId: UserId) => [...streakKeys.all, 'account', userId] as const,
  getStreak: (userId: UserId, req: GetStreakRequest) =>
    [...streakKeys.account(userId), 'getStreak', req] as const,
}
