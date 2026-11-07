import { HealthCheckResponse } from '@inzpro/api-contracts/modules/health/responses'
import { Context, Effect, Layer } from 'effect'

export class HealthCheckService extends Context.Service<
  HealthCheckService,
  {
    readonly check: Effect.Effect<HealthCheckResponse>
  }
>()('api/modules/health/HealthCheckService') {
  static readonly layer = Layer.succeed(
    this,
    HealthCheckService.of({
      check: Effect.succeed(HealthCheckResponse.make({ status: 'ok' })),
    }),
  )
}
