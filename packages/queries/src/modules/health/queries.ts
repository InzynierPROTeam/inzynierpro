import { checkHealth, type CheckHealthRequest } from '@inzpro/api-client/modules/health'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { healthKeys } from './keys.js'

export const checkHealthQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: CheckHealthRequest = {},
) => effectQueryOptions(healthKeys.checkHealth(req), checkHealth(req), httpClient)
