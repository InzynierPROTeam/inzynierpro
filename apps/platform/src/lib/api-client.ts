import { makeApiHttpClient } from '@inzpro/api-client/lib/http-client'
import { isBrowser } from '@inzpro/browser-utils/common'
import { createServerOnlyFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientRequest } from 'effect/http'
import { env } from '~platform/lib/env'

const getVisitorCookie = createServerOnlyFn(() => getRequestHeader('cookie'))

const withVisitorCookie = (request: HttpClientRequest.HttpClientRequest) => {
  const cookie = isBrowser ? undefined : getVisitorCookie()

  return cookie === undefined ? request : HttpClientRequest.setHeader(request, 'cookie', cookie)
}

export const apiHttpClient = Effect.runSync(
  makeApiHttpClient({ baseUrl: env.VITE_API_URL }).pipe(
    Effect.map(client =>
      client.pipe(
        HttpClient.mapRequest(withVisitorCookie),
        HttpClient.transform(effect =>
          Effect.provideService(effect, FetchHttpClient.RequestInit, { credentials: 'include' }),
        ),
      ),
    ),
    Effect.provide(FetchHttpClient.layer),
  ),
)
