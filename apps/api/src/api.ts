import { Api } from '@inzpro/api-contracts/api'
import { Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { HealthLive } from '~api/modules/health/http.js'
import { IdentityLive } from '~api/modules/identity/http.js'

export const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(Layer.mergeAll(HealthLive, IdentityLive)),
)
