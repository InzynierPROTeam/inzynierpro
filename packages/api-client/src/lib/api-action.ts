import { Api } from '@inzpro/api-contracts/api'
import { Effect } from 'effect'
import { HttpApiClient } from 'effect/http-api'

const clientEffect = HttpApiClient.make(Api)

type ApiClient = Effect.Success<typeof clientEffect>

export const apiAction = <A, E, R>(action: (api: ApiClient) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(clientEffect, action)
