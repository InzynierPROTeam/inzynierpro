import { withHttpServer } from '@inzpro/testing/http'
import { Effect } from 'effect'
import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpRouter,
  HttpServerResponse,
  HttpServerRequest,
} from 'effect/http'
import { expect, test } from 'vitest'

import { checkHealth } from '../modules/health.js'
import { makeApiHttpClient } from './http-client.js'
import { runApi } from './run-api.js'

test('the shared transport composes a base path with consumer request policies', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/proxy/api/v1/health-check',
        Effect.map(HttpServerRequest.HttpServerRequest, request =>
          HttpServerResponse.jsonUnsafe({
            status: request.headers['x-app'] === 'platform' ? 'ok' : 'missing-header',
          }),
        ),
      ),
    ],
    async ({ baseUrl }) => {
      const client = Effect.runSync(
        makeApiHttpClient({ baseUrl: new URL('/proxy/', baseUrl) }).pipe(
          Effect.provide(FetchHttpClient.layer),
          Effect.map(HttpClient.mapRequest(HttpClientRequest.setHeader('x-app', 'platform'))),
        ),
      )

      expect(await runApi(checkHealth(), client)).toEqual({ status: 'ok' })
    },
  ))

test('consumer-supplied transport timeouts remain typed HTTP failures', () =>
  withHttpServer(
    [HttpRouter.route('GET', '/api/v1/health-check', Effect.never)],
    async ({ baseUrl }) => {
      const client = Effect.runSync(
        makeApiHttpClient({ baseUrl: new URL(baseUrl), timeout: '20 millis' }).pipe(
          Effect.provide(FetchHttpClient.layer),
        ),
      )

      const request = runApi(checkHealth(), client)

      await expect(request).rejects.toSatisfy(HttpClientError.isHttpClientError)
      await expect(request).rejects.toHaveProperty('reason.cause._tag', 'TimeoutError')
    },
  ))
