import type {
  GetExamSessionRankingEndpoint,
  GetPeriodRankingEndpoint,
} from '@inzpro/api-contracts/modules/rankings/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getPeriodRanking = (req: GetPeriodRankingRequest) =>
  apiAction(api => api.Rankings.GetPeriodRanking(req))

export type GetPeriodRankingRequest = InferEndpointRequest<typeof GetPeriodRankingEndpoint>

export type GetPeriodRankingRes = Effect.Success<ReturnType<typeof getPeriodRanking>>

export type GetPeriodRankingError = Effect.Error<ReturnType<typeof getPeriodRanking>>

export const getExamSessionRanking = (req: GetExamSessionRankingRequest) =>
  apiAction(api => api.Rankings.GetExamSessionRanking(req))

export type GetExamSessionRankingRequest = InferEndpointRequest<
  typeof GetExamSessionRankingEndpoint
>

export type GetExamSessionRankingRes = Effect.Success<ReturnType<typeof getExamSessionRanking>>

export type GetExamSessionRankingError = Effect.Error<ReturnType<typeof getExamSessionRanking>>
