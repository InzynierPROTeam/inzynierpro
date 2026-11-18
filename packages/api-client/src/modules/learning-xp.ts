import type { GetLearningXpEndpoint } from '@inzpro/api-contracts/modules/learning-xp/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getLearningXp = (req: GetLearningXpRequest = {}) =>
  apiAction(api => api.LearningXp.GetLearningXp(req))

export type GetLearningXpRequest = InferEndpointRequest<typeof GetLearningXpEndpoint>

export type GetLearningXpRes = Effect.Success<ReturnType<typeof getLearningXp>>

export type GetLearningXpError = Effect.Error<ReturnType<typeof getLearningXp>>
