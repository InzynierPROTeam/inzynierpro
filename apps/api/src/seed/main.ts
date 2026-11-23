import { NodeRuntime } from '@effect/platform-node'
import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer, Option } from 'effect'
import { SqlClient } from 'effect/sql'
import { seedEnv } from '~api/lib/env.js'
import { fileStorageS3LayerFromConfig } from '~api/modules/learning-content/infrastructure/file-storage.service.s3.js'
import { seedDemoLearner } from '~api/seed/demo-learner.js'
import { seedRankedLearners } from '~api/seed/ranked-learners.js'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const { SEED_DEMO_EMAIL } = yield* seedEnv

  yield* seedTechnicalCatalogue

  if (Option.isNone(SEED_DEMO_EMAIL)) {
    return yield* Effect.logInfo('Skipping demo learning data: SEED_DEMO_EMAIL is not set')
  }

  yield* sql.withTransaction(
    seedDemoLearner(SEED_DEMO_EMAIL.value).pipe(Effect.andThen(seedRankedLearners())),
  )
  yield* Effect.logInfo(
    'Seeded demo learning data for the SEED_DEMO_EMAIL account and ranked learners',
  )
}).pipe(
  Effect.provide(Layer.mergeAll(databaseLayerFromConfig, fileStorageS3LayerFromConfig)),
  Effect.scoped,
  NodeRuntime.runMain,
)
