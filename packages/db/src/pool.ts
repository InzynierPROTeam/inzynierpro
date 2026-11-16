import { Context, Effect, Layer, Redacted } from 'effect'
import { Pool } from 'pg'

export class PgPool extends Context.Service<PgPool, Pool>()('PgPool') {}

export type PgPoolConfig = {
  readonly url: Redacted.Redacted
}

export const pgPoolLayer = (config: PgPoolConfig) =>
  Layer.effect(
    PgPool,
    Effect.acquireRelease(
      Effect.gen(function* () {
        const runFork = Effect.runForkWith(yield* Effect.context())
        const pgPool = new Pool({ connectionString: Redacted.value(config.url), max: 10 })

        pgPool.on('error', (error: Error) => {
          runFork(Effect.logError('[PgPool]: Idle client error.', error))
        })

        return pgPool
      }),
      pgPool => Effect.promise(() => pgPool.end()),
    ),
  )
