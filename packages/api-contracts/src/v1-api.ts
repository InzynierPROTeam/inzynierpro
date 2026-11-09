import { HttpApi } from 'effect/http-api'
import { HealthCheckApi } from '~api-contracts/modules/health/api.js'
import { IdentityApi } from '~api-contracts/modules/identity/api.js'

export class V1Api extends HttpApi.make('v1').add(HealthCheckApi).add(IdentityApi).prefix('/v1') {}
