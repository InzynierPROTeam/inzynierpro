import {
  getCurrentSession,
  getOptionalCurrentSession,
  type GetOptionalCurrentSessionRequest,
  type GetCurrentSessionRequest,
} from '@inzpro/api-client/modules/identity'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

export const identityKeys = {
  all: ['identity'] as const,
  session: () => [...identityKeys.all, 'session'] as const,
  getOptionalCurrentSession: (req: GetOptionalCurrentSessionRequest) =>
    [...identityKeys.session(), 'getOptionalCurrentSession', req] as const,
  getCurrentSession: (req: GetCurrentSessionRequest) =>
    [...identityKeys.session(), 'getCurrentSession', req] as const,
}

export const currentSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: GetCurrentSessionRequest = {},
) => effectQueryOptions(identityKeys.getCurrentSession(req), getCurrentSession(req), httpClient)

export const optionalCurrentSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: GetOptionalCurrentSessionRequest = {},
) =>
  effectQueryOptions(
    identityKeys.getOptionalCurrentSession(req),
    getOptionalCurrentSession(req),
    httpClient,
  )
