import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Auth, authBasePath } from '@inzpro/auth'
import { Effect, Layer } from 'effect'
import { HttpEffect, HttpRouter } from 'effect/http'
import { HttpApiBuilder } from 'effect/http-api'
import { AuthenticationLive } from '~api/middleware/authentication.js'

export const AuthHttp = Layer.unwrap(
  Effect.gen(function* () {
    const auth = yield* Auth

    return HttpRouter.add('*', `${authBasePath}/*`, HttpEffect.fromWebHandler(auth.handler))
  }),
)

export const IdentityLive = HttpApiBuilder.group(Api, 'Identity', handlers =>
  Effect.succeed(
    handlers.handle('GetCurrentSession', () =>
      Effect.gen(function* () {
        const user = yield* CurrentUser

        return { user }
      }),
    ),
  ),
).pipe(Layer.provide(AuthenticationLive))
