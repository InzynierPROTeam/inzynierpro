import { Effect } from 'effect'
import type { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'
import { fileStorageS3LayerFromConfig } from '~api/modules/learning-content/infrastructure/file-storage.service.s3.js'

export const runWithFileStorage = <A, E>(operation: Effect.Effect<A, E, FileStorage>) =>
  Effect.runPromise(operation.pipe(Effect.provide(fileStorageS3LayerFromConfig)))
