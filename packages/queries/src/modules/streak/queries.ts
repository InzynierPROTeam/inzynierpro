import { getStreak, type GetStreakRequest } from '@inzpro/api-client/modules/streak'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { streakKeys } from './keys.js'

export const streakQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetStreakRequest = {},
) => effectQueryOptions(streakKeys.getStreak(userId, req), getStreak(req), httpClient)
