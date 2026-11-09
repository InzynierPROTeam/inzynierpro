import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { CurrentSessionResponse } from '~api-contracts/modules/identity/responses.js'

export const GetCurrentSessionEndpoint = HttpApiEndpoint.get('GetCurrentSession', '/session', {
  success: CurrentSessionResponse,
})

export const IdentityApi = HttpApiGroup.make('Identity')
  .add(GetCurrentSessionEndpoint)
  .middleware(Authentication)
  .prefix('/identity')
