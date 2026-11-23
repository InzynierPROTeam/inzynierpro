import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer } from 'effect'
import { fileStorageS3LayerFromConfig } from '~api/modules/learning-content/infrastructure/file-storage.service.s3.js'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

export default async function setup() {
  await Effect.runPromise(
    seedTechnicalCatalogue.pipe(
      Effect.provide(Layer.mergeAll(databaseLayerFromConfig, fileStorageS3LayerFromConfig)),
      Effect.scoped,
    ),
  )
}
