import { readFile } from 'node:fs/promises'

import { ContentAssetId, pngMediaType } from '@inzpro/domain/modules/learning-content/content-asset'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'
import { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'

import { catalogueId } from './catalogue-id.js'

export const stairRiserHeightAssetId = ContentAssetId.make(catalogueId('28', 1))

const asset = {
  id: stairRiserHeightAssetId,
  storageKey: `content-assets/${stairRiserHeightAssetId}.png`,
  mediaType: pngMediaType,
  width: 640,
  height: 360,
  file: new URL('./assets/stair-riser-height.png', import.meta.url),
} as const

export const seedContentAssets = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const fileStorage = yield* FileStorage
  const body = new Uint8Array(yield* Effect.tryPromise(() => readFile(asset.file)))

  yield* fileStorage.put({ key: asset.storageKey, mediaType: asset.mediaType, body })
  yield* sql`INSERT INTO content_assets (id,storage_key,media_type,width,height,size_bytes)
      VALUES (${asset.id},${asset.storageKey},${asset.mediaType},${asset.width},${asset.height},${body.byteLength})
      ON CONFLICT (id) DO UPDATE SET storage_key=EXCLUDED.storage_key,media_type=EXCLUDED.media_type,width=EXCLUDED.width,height=EXCLUDED.height,size_bytes=EXCLUDED.size_bytes`
})
