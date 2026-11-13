import { Context, Effect, Layer } from 'effect'

export type HealthStatus = { readonly status: 'ok' }

export class HealthCheckService extends Context.Service<
  HealthCheckService,
  {
    readonly check: Effect.Effect<HealthStatus>
  }
>()('api/modules/health/HealthCheckService') {
  static readonly layer = Layer.succeed(
    this,
    HealthCheckService.of({
      check: Effect.succeed({ status: 'ok' }),
    }),
  )
}
