import { Context, Effect, Layer, Redacted } from 'effect'
import { Pool } from 'pg'

// A plain node-postgres pool for libraries that need one, such as Better Auth.
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
        const pool = new Pool({ connectionString: Redacted.value(config.url), max: 10 })

        // An idle client failing must not crash the process; the next query reports the problem.
        pool.on('error', (error: Error) => {
          runFork(Effect.logError('[PgPool]: Idle client error.', error.name))
        })

        return pool
      }),
      pool => Effect.promise(() => pool.end()),
    ),
  )
