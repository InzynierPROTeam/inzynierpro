import {
  getExamSessionRanking,
  type GetExamSessionRankingRequest,
  getPeriodRanking,
  type GetPeriodRankingRequest,
} from '@inzpro/api-client/modules/rankings'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { rankingKeys } from './keys.js'

export const periodRankingQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPeriodRankingRequest,
) =>
  effectQueryOptions(rankingKeys.getPeriodRanking(userId, req), getPeriodRanking(req), httpClient)

export const examSessionRankingQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetExamSessionRankingRequest,
) =>
  effectQueryOptions(
    rankingKeys.getExamSessionRanking(userId, req),
    getExamSessionRanking(req),
    httpClient,
  )
