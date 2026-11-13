import type { GetCurrentSessionEndpoint } from '@inzpro/api-contracts/modules/identity/api'
import { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getCurrentSession = (req: GetCurrentSessionRequest = {}) =>
  apiAction(api => api.Identity.GetCurrentSession(req))

export type GetCurrentSessionRequest = InferEndpointRequest<typeof GetCurrentSessionEndpoint>

export type GetCurrentSessionRes = Effect.Success<ReturnType<typeof getCurrentSession>>

export type GetCurrentSessionError = Effect.Error<ReturnType<typeof getCurrentSession>>

// The public onboarding screen treats a signed-out account as an ordinary empty state.
export const getOptionalCurrentSession = (req: GetOptionalCurrentSessionRequest = {}) =>
  apiAction(api => api.Identity.GetCurrentSession(req)).pipe(
    Effect.catchTag('Unauthenticated', () => Effect.succeed(null)),
  )

export type GetOptionalCurrentSessionRequest = InferEndpointRequest<
  typeof GetCurrentSessionEndpoint
>

export type GetOptionalCurrentSessionRes = Effect.Success<
  ReturnType<typeof getOptionalCurrentSession>
>

export type GetOptionalCurrentSessionError = Effect.Error<
  ReturnType<typeof getOptionalCurrentSession>
>
