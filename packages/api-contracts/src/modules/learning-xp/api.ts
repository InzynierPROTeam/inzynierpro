import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { InternalServerError, RateLimitExceeded } from '~api-contracts/utils/api-error.js'

import { LearningXpResponse } from './responses.js'

export const GetLearningXpEndpoint = HttpApiEndpoint.get('GetLearningXp', '/learning-xp', {
  success: LearningXpResponse,
  error: [InternalServerError, RateLimitExceeded],
})

export const LearningXpApi = HttpApiGroup.make('LearningXp')
  .add(GetLearningXpEndpoint)
  .middleware(Authentication)
