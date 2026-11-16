import { Api } from '@inzpro/api-contracts/api'
import { HttpApiBuilder } from 'effect/http-api'
import { HealthCheckService } from '~api/modules/health/application/health-check.service.js'

export const HealthLive = HttpApiBuilder.group(Api, 'HealthCheck', handlers =>
  handlers.handle('CheckHealth', () => HealthCheckService.use(service => service.check)),
)

export const HealthRequestServices = HealthCheckService.layer
