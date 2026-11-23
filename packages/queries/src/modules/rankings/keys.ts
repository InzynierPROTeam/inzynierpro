import type {
  GetExamSessionRankingRequest,
  GetPeriodRankingRequest,
} from '@inzpro/api-client/modules/rankings'
import type { UserId } from '@inzpro/domain/modules/identity/user'

export const rankingKeys = {
  all: ['rankings'] as const,
  account: (userId: UserId) => [...rankingKeys.all, 'account', userId] as const,
  getPeriodRanking: (userId: UserId, req: GetPeriodRankingRequest) =>
    [...rankingKeys.account(userId), 'getPeriodRanking', req] as const,
  getExamSessionRanking: (userId: UserId, req: GetExamSessionRankingRequest) =>
    [...rankingKeys.account(userId), 'getExamSessionRanking', req] as const,
}
