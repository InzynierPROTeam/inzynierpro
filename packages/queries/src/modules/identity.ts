import { getCurrentSession } from '@inzpro/api-client/modules/identity'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

export const identityKeys = {
  all: ['identity'] as const,
  general: () => [...identityKeys.all, 'general'] as const,
  session: () => [...identityKeys.general(), 'session'] as const,
}

export const currentSessionQueryOptions = (httpClient: HttpClient.HttpClient) =>
  effectQueryOptions(identityKeys.session(), getCurrentSession, httpClient)
