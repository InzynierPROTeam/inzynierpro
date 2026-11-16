import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect } from 'effect'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

export default async function setup() {
  await Effect.runPromise(
    seedTechnicalCatalogue.pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped),
  )
}
