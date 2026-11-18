import { getLearningXp, type GetLearningXpRequest } from '@inzpro/api-client/modules/learning-xp'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { learningXpKeys } from './keys.js'

export const learningXpQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetLearningXpRequest = {},
) => effectQueryOptions(learningXpKeys.getLearningXp(userId, req), getLearningXp(req), httpClient)
