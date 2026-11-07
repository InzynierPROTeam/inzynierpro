import { PgClient } from '@effect/sql-pg'
import { Duration, Effect, Layer, Redacted, String } from 'effect'
import { env } from '~db/lib/env.js'

export type DatabaseConfig = {
  readonly url: Redacted.Redacted
}

export const databaseLayer = (config: DatabaseConfig) =>
  PgClient.layer({
    url: config.url,
    maxConnections: 20,
    connectTimeout: Duration.seconds(10),
    acquireTimeout: Duration.seconds(10),
    transformQueryNames: String.camelToSnake,
    transformResultNames: String.snakeToCamel,
  })

export const databaseLayerFromConfig = Layer.unwrap(
  Effect.map(env, config => databaseLayer({ url: config.DATABASE_URL })),
)
