import {
  getCurrentSession,
  getOptionalCurrentSession,
  type GetOptionalCurrentSessionRequest,
  type GetCurrentSessionRequest,
} from '@inzpro/api-client/modules/identity'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { identityKeys } from './keys.js'

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
