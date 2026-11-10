import { NodeRuntime } from '@effect/platform-node'
import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect } from 'effect'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

seedTechnicalCatalogue.pipe(
  Effect.provide(databaseLayerFromConfig),
  Effect.scoped,
  NodeRuntime.runMain,
)
