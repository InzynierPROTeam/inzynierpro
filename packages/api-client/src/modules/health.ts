import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'

export const checkHealth = apiAction(api => api.HealthCheck.CheckHealth())

export type CheckHealthRes = Effect.Success<typeof checkHealth>

export type HealthCheckError = Effect.Error<typeof checkHealth>

export type HealthCheckErrorType = Extract<HealthCheckError, { readonly type: string }>['type']
