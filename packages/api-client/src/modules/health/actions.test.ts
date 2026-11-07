import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpClient, HttpClientError, HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, expectTypeOf, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { checkHealth, type HealthCheckErrorType } from '~api-client/modules/health/actions.js'

const healthPath = '/api/v1/health-check'

test('the health action calls the versioned endpoint using the supplied client', () =>
  withHttpServer(
    [HttpRouter.route('GET', healthPath, HttpServerResponse.jsonUnsafe({ status: 'ok' }))],
    async ({ httpClient }) => {
      expect(await runApi(checkHealth, httpClient)).toEqual({ status: 'ok' })
      expectTypeOf<HealthCheckErrorType>().toBeNever()
    },
  ))

test('the health action rejects responses that do not match the contract', () =>
  withHttpServer(
    [HttpRouter.route('GET', healthPath, HttpServerResponse.jsonUnsafe({ status: 123 }))],
    async ({ httpClient }) => {
      await expect(runApi(checkHealth, httpClient)).rejects.toSatisfy(Schema.isSchemaError)
    },
  ))

test('the HTTP client owns the request timeout and preserves its transport error', () =>
  withHttpServer([HttpRouter.route('GET', healthPath, Effect.never)], async ({ httpClient }) => {
    const client = HttpClient.timeout(httpClient, '20 millis')
    const request = runApi(checkHealth, client)

    await expect(request).rejects.toSatisfy(HttpClientError.isHttpClientError)
    await expect(request).rejects.toHaveProperty('reason.cause._tag', 'TimeoutError')
  }))
