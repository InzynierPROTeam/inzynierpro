import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'

export const getCurrentSession = apiAction(api => api.Identity.GetCurrentSession())

export type GetCurrentSessionRes = Effect.Success<typeof getCurrentSession>

export type GetCurrentSessionError = Effect.Error<typeof getCurrentSession>
