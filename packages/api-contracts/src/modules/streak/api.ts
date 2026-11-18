import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { InternalServerError, RateLimitExceeded } from '~api-contracts/utils/api-error.js'

import { Streak } from './responses.js'

export const GetStreakEndpoint = HttpApiEndpoint.get('GetStreak', '/streak', {
  success: Streak,
  error: [InternalServerError, RateLimitExceeded],
})

export const StreakApi = HttpApiGroup.make('Streak')
  .add(GetStreakEndpoint)
  .middleware(Authentication)
