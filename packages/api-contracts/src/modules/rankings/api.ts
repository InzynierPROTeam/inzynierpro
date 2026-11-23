import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import { ExamSessionRankingParams, PeriodRankingParams } from './requests.js'
import { Ranking } from './responses.js'

export const GetPeriodRankingEndpoint = HttpApiEndpoint.get(
  'GetPeriodRanking',
  '/rankings/periods/:period',
  {
    params: PeriodRankingParams,
    success: Ranking,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

// CONTRACT: An exam session without recorded XP, including an unknown one, has an empty ranking.
export const GetExamSessionRankingEndpoint = HttpApiEndpoint.get(
  'GetExamSessionRanking',
  '/rankings/exam-sessions/:examSessionId',
  {
    params: ExamSessionRankingParams,
    success: Ranking,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

export const RankingsApi = HttpApiGroup.make('Rankings')
  .add(GetPeriodRankingEndpoint)
  .add(GetExamSessionRankingEndpoint)
  .middleware(Authentication)
