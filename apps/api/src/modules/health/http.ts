import { Api } from '@inzpro/api-contracts/api'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { HealthCheckService } from '~api/modules/health/health-check.service.js'

export const HealthLive = HttpApiBuilder.group(
  Api,
  'HealthCheck',
  Effect.fn(function* (handlers) {
    const healthCheckService = yield* HealthCheckService

    return handlers.handle('CheckHealth', () => healthCheckService.check)
  }),
).pipe(Layer.provide(HealthCheckService.layer))
