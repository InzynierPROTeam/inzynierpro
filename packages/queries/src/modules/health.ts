import { checkHealth } from '@inzpro/api-client/modules/health/actions'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

export const healthKeys = {
  all: ['health'] as const,
  general: () => [...healthKeys.all, 'general'] as const,
  check: () => [...healthKeys.general(), 'check'] as const,
}

export const checkHealthQueryOptions = (httpClient: HttpClient.HttpClient) =>
  effectQueryOptions(healthKeys.check(), checkHealth, httpClient)
