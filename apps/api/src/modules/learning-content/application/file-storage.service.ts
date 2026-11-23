import type { ContentAssetMediaType } from '@inzpro/domain/modules/learning-content/content-asset'
import { Context, type Duration, type Effect } from 'effect'

import type { FileStorageError } from './errors.js'

export type StoredFile = {
  readonly key: string
  readonly mediaType: ContentAssetMediaType
  readonly body: Uint8Array
}

export class FileStorage extends Context.Service<
  FileStorage,
  {
    readonly put: (file: StoredFile) => Effect.Effect<void, FileStorageError>
    readonly signedGetUrl: (
      key: string,
      lifetime: Duration.Duration,
    ) => Effect.Effect<string, FileStorageError>
  }
>()('api/modules/learning-content/FileStorage') {}
