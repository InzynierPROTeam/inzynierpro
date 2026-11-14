import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect } from 'effect'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

// Seeds the shared catalogue once before any test file runs. Seeding per file upserted the same rows
// while other files ran, which deadlocked and reset rows mid-test.
export default async function setup() {
  await Effect.runPromise(
    seedTechnicalCatalogue.pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped),
  )
}
