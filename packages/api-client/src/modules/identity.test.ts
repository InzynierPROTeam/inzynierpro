import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { getCurrentSession, getOptionalCurrentSession } from '~api-client/modules/identity.js'

const sessionPath = '/api/v1/identity/session'

const user = {
  id: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a',
  email: 'kandydat@example.com',
  name: '',
  image: 'https://example.com/avatar.png',
}

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

test('public session lookup converts only Unauthenticated into a successful null', () =>
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
      expect(await runApi(getOptionalCurrentSession(), httpClient)).toBeNull()
      await expect(runApi(getCurrentSession(), httpClient)).rejects.toBeInstanceOf(Unauthenticated)
    },
  ))

test('a server failure is not treated as an absent public session', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        sessionPath,
        HttpServerResponse.jsonUnsafe({ error: 'unavailable' }, { status: 500 }),
      ),
    ],
    async ({ httpClient }) => {
      await expect(runApi(getOptionalCurrentSession(), httpClient)).rejects.toBeDefined()
    },
  ))
