import { Effect } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientRequest } from 'effect/http'
import { env } from '~platform/lib/env'

export const makeHttpClient = () =>
  Effect.runSync(
    HttpClient.HttpClient.pipe(
      Effect.map(client =>
        client.pipe(
          HttpClient.mapRequest(HttpClientRequest.prependUrl(env.VITE_API_URL)),
          HttpClient.timeout('5 seconds'),
        ),
      ),
      Effect.provide(FetchHttpClient.layer),
    ),
  )
