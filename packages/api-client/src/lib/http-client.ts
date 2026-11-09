import { Effect, type Duration } from 'effect'
import { HttpClient, HttpClientRequest } from 'effect/http'

export type ApiHttpClientConfig = {
  baseUrl: URL
  timeout?: Duration.Input
}

export const makeApiHttpClient = ({ baseUrl, timeout = '5 seconds' }: ApiHttpClientConfig) =>
  Effect.map(HttpClient.HttpClient, client =>
    client.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl.href)),
      HttpClient.timeout(timeout),
    ),
  )
