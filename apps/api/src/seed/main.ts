import { NodeRuntime } from '@effect/platform-node'
import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'
import { seedDemoLearner } from '~api/seed/demo-learner.js'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* seedTechnicalCatalogue
  yield* sql.withTransaction(seedDemoLearner)
}).pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped, NodeRuntime.runMain)
