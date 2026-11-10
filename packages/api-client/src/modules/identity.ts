import type { GetCurrentSessionEndpoint } from '@inzpro/api-contracts/modules/identity/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getCurrentSession = (req: GetCurrentSessionRequest = {}) =>
  apiAction(api => api.Identity.GetCurrentSession(req))

export type GetCurrentSessionRequest = InferEndpointRequest<typeof GetCurrentSessionEndpoint>

export type GetCurrentSessionRes = Effect.Success<ReturnType<typeof getCurrentSession>>

export type GetCurrentSessionError = Effect.Error<ReturnType<typeof getCurrentSession>>
