import type { GetLearningXpRequest } from '@inzpro/api-client/modules/learning-xp'
import type { UserId } from '@inzpro/domain/modules/identity/user'

export const learningXpKeys = {
  all: ['learning-xp'] as const,
  account: (userId: UserId) => [...learningXpKeys.all, 'account', userId] as const,
  getLearningXp: (userId: UserId, req: GetLearningXpRequest) =>
    [...learningXpKeys.account(userId), 'getLearningXp', req] as const,
}
