import { Authentication } from '@inzpro/api-contracts/middleware/authentication/api'
import {
  CurrentUser,
  SessionUser,
} from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { Auth } from '@inzpro/auth'
import { Effect, Layer, Schema } from 'effect'
import { Cookies, HttpServerRequest, HttpServerResponse } from 'effect/http'

const unauthenticated = new Unauthenticated({
  type: 'unauthenticated',
  message: 'A valid session is required.',
})

export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const auth = yield* Auth

    return Authentication.of(httpEffect =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest

        // A storage failure is a server error, not a sign-out, so it is not mapped to 401.
        const { headers, response: session } = yield* Effect.promise(() =>
          auth.api.getSession({ headers: new Headers(request.headers), returnHeaders: true }),
        )

        if (session === null) {
          return yield* unauthenticated
        }

        const user = yield* Schema.decodeEffect(SessionUser)(session.user).pipe(
          Effect.mapError(() => unauthenticated),
        )

        const response = yield* Effect.provideService(httpEffect, CurrentUser, user)

        // Better Auth refreshes the cookie when it extends the session.
        return HttpServerResponse.mergeCookies(
          HttpServerResponse.setHeader(response, 'cache-control', 'private, no-store'),
          Cookies.fromSetCookie(headers.getSetCookie()),
        )
      }),
    )
  }),
)
