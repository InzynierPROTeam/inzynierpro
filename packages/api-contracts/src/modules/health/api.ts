import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { HealthCheckResponse } from '~api-contracts/modules/health/responses.js'

export const CheckHealthEndpoint = HttpApiEndpoint.get('CheckHealth', '/health-check', {
  success: HealthCheckResponse,
})

export const HealthCheckApi = HttpApiGroup.make('HealthCheck').add(CheckHealthEndpoint)
