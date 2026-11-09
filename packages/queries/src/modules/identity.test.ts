import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { currentSessionQueryOptions, identityKeys } from '~queries/modules/identity.js'
import { withQueryClient } from '~queries/test/query-client.js'

const sessionPath = '/api/v1/identity/session'
const user = { id: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a', email: 'kandydat@example.com', name: '' }

test('the current session is cached under the identity module key', () =>
  withHttpServer(
    [HttpRouter.route('GET', sessionPath, HttpServerResponse.jsonUnsafe({ user }))],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const options = currentSessionQueryOptions(httpClient)

        expect(options.queryKey).toEqual(['identity', 'general', 'session'])
        expect(await queryClient.query(options)).toEqual({ user })

        await queryClient.invalidateQueries({ queryKey: identityKeys.all })

        expect(queryClient.getQueryState(options.queryKey)?.isInvalidated).toBe(true)
      }),
  ))

test('a missing session fails the query with Unauthenticated instead of returning data', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        sessionPath,
        HttpServerResponse.jsonUnsafe(
          Schema.encodeSync(Unauthenticated)(
            new Unauthenticated({
              type: 'unauthenticated',
              message: 'A valid session is required.',
            }),
          ),
          { status: 401 },
        ),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        await expect(
          queryClient.query(currentSessionQueryOptions(httpClient)),
        ).rejects.toBeInstanceOf(Unauthenticated)
      }),
  ))
