import type { ResetPathEndpoint } from '@inzpro/api-contracts/modules/path-reset/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const resetPath = (req: ResetPathRequest) => apiAction(api => api.PathReset.ResetPath(req))

export type ResetPathRequest = InferEndpointRequest<typeof ResetPathEndpoint>

export type ResetPathRes = Effect.Success<ReturnType<typeof resetPath>>

export type ResetPathError = Effect.Error<ReturnType<typeof resetPath>>
