import { HttpApi } from 'effect/http-api'
import { HealthCheckApi } from '~api-contracts/modules/health/api.js'

export class V1Api extends HttpApi.make('v1').add(HealthCheckApi).prefix('/v1') {}
