import { checkHealth, type CheckHealthRequest } from '@inzpro/api-client/modules/health'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
  checkHealth: (req: CheckHealthRequest) => [...healthKeys.status(), 'checkHealth', req] as const,
}

export const checkHealthQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: CheckHealthRequest = {},
) => effectQueryOptions(healthKeys.checkHealth(req), checkHealth(req), httpClient)
