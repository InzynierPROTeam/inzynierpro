import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { getCurrentSession } from '~api-client/modules/identity.js'

const sessionPath = '/api/v1/identity/session'
const user = { id: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a', email: 'kandydat@example.com', name: '' }

test('the current session is decoded from the shared contract', () =>
  withHttpServer(
    [HttpRouter.route('GET', sessionPath, HttpServerResponse.jsonUnsafe({ user }))],
    async ({ httpClient }) => {
      expect(await runApi(getCurrentSession(), httpClient)).toEqual({ user })
    },
  ))

test('a missing session is a typed Unauthenticated error', () =>
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
    async ({ httpClient }) => {
      await expect(runApi(getCurrentSession(), httpClient)).rejects.toBeInstanceOf(Unauthenticated)
    },
  ))
