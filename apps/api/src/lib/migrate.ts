import { fileURLToPath } from 'node:url'

import { NodeRuntime, NodeServices } from '@effect/platform-node'
import { databaseLayer } from '@inzpro/db'
import { Effect, Layer } from 'effect'
import { Migrator } from 'effect/sql'
import { fromFileSystem } from 'effect/sql/MigratorFileSystem'
import { env } from '~api/lib/env.js'

const DatabaseLive = Layer.unwrap(
  Effect.map(env, config => databaseLayer({ url: config.DATABASE_URL })),
)

const migrate = Migrator.make({})({
  loader: fromFileSystem(fileURLToPath(new URL('../migrations', import.meta.url))),
})

migrate.pipe(
  Effect.provide(DatabaseLive),
  Effect.provide(NodeServices.layer),
  Effect.scoped,
  NodeRuntime.runMain,
)
