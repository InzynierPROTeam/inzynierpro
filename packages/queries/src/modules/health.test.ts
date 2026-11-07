import type { HealthCheckError } from '@inzpro/api-client/modules/health/actions'
import { withHttpServer } from '@inzpro/testing/http'
import { CancelledError } from '@tanstack/react-query'
import { Deferred, Effect } from 'effect'
import { HttpClientError, HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, expectTypeOf, test } from 'vitest'
import { checkHealthQueryOptions, healthKeys } from '~queries/modules/health.js'
import { withQueryClient } from '~queries/test/query-client.js'

const healthPath = '/api/v1/health-check'

test('query options fetch and cache data with the inferred result and error types', () =>
  withHttpServer(
    [HttpRouter.route('GET', healthPath, HttpServerResponse.jsonUnsafe({ status: 'ok' }))],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const options = checkHealthQueryOptions(httpClient)

        expect(await queryClient.query(options)).toEqual({ status: 'ok' })
        expect(queryClient.getQueryData(options.queryKey)).toEqual({ status: 'ok' })
        expectTypeOf(queryClient.getQueryData(options.queryKey)).toEqualTypeOf<
          { readonly status: 'ok' } | undefined
        >()
        expectTypeOf(queryClient.getQueryState(options.queryKey)?.error).toEqualTypeOf<
          HealthCheckError | null | undefined
        >()

        await queryClient.invalidateQueries({ queryKey: healthKeys.general() })

        expect(queryClient.getQueryState(options.queryKey)?.isInvalidated).toBe(true)
      }),
  ))

test('query failures preserve the HTTP client error instead of becoming successful data', () =>
  withHttpServer([], ({ httpClient }) =>
    withQueryClient(async queryClient => {
      await expect(queryClient.query(checkHealthQueryOptions(httpClient))).rejects.toSatisfy(
        HttpClientError.isHttpClientError,
      )
    }),
  ))

test('cancelling a query aborts its underlying HTTP request', async () => {
  const requestStarted = Deferred.makeUnsafe<void>()
  const requestInterrupted = Deferred.makeUnsafe<void>()

  const handler = Deferred.succeed(requestStarted, undefined).pipe(
    Effect.andThen(Effect.never),
    Effect.onInterrupt(() => Deferred.succeed(requestInterrupted, undefined)),
  )

  await withHttpServer([HttpRouter.route('GET', healthPath, handler)], ({ httpClient }) =>
    withQueryClient(async queryClient => {
      const options = checkHealthQueryOptions(httpClient)
      const request = queryClient.query(options)
      const rejected = expect(request).rejects.toBeInstanceOf(CancelledError)

      await Effect.runPromise(Deferred.await(requestStarted))
      await queryClient.cancelQueries({ queryKey: healthKeys.all })
      await rejected
      await Effect.runPromise(Deferred.await(requestInterrupted))

      expect(queryClient.getQueryState(options.queryKey)?.fetchStatus).toBe('idle')
    }),
  )
})
