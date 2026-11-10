import type { CheckHealthEndpoint } from '@inzpro/api-contracts/modules/health/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const checkHealth = (req: CheckHealthRequest = {}) =>
  apiAction(api => api.HealthCheck.CheckHealth(req))

export type CheckHealthRequest = InferEndpointRequest<typeof CheckHealthEndpoint>

export type CheckHealthRes = Effect.Success<ReturnType<typeof checkHealth>>

export type CheckHealthError = Effect.Error<ReturnType<typeof checkHealth>>

export type CheckHealthErrorType = Extract<CheckHealthError, { readonly type: string }>['type']
