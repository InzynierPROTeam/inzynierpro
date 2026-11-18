import type { GetStreakEndpoint } from '@inzpro/api-contracts/modules/streak/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getStreak = (req: GetStreakRequest = {}) => apiAction(api => api.Streak.GetStreak(req))

export type GetStreakRequest = InferEndpointRequest<typeof GetStreakEndpoint>

export type GetStreakRes = Effect.Success<ReturnType<typeof getStreak>>

export type GetStreakError = Effect.Error<ReturnType<typeof getStreak>>
