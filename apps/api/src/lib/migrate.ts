import { fileURLToPath } from 'node:url'

import { NodeRuntime, NodeServices } from '@effect/platform-node'
import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer } from 'effect'
import { Migrator } from 'effect/sql'
import { fromFileSystem } from 'effect/sql/MigratorFileSystem'

const migrate = Migrator.make({})({
  loader: fromFileSystem(fileURLToPath(new URL('../migrations', import.meta.url))),
})

migrate.pipe(
  Effect.provide(Layer.mergeAll(databaseLayerFromConfig, NodeServices.layer)),
  Effect.scoped,
  NodeRuntime.runMain,
)
