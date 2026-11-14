import { Api } from '@inzpro/api-contracts/api'
import { HttpApiBuilder } from 'effect/http-api'
import { HealthCheckService } from '~api/modules/health/application/health-check.service.js'

export const HealthLive = HttpApiBuilder.group(Api, 'HealthCheck', handlers =>
  handlers.handle('CheckHealth', () => HealthCheckService.use(service => service.check)),
)

/** Services the health handlers need per request; the API layer provides them where routes are registered. */
export const HealthRequestServices = HealthCheckService.layer
