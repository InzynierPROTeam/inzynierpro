import type { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, Duration, Effect } from 'effect'

import { ContentAssetReader } from './content-asset.reader.js'
import { FileStorage } from './file-storage.service.js'

export type ContentAssetAddresses = ReadonlyMap<ContentAssetId, string>

const contentAssetAddressLifetime = Duration.hours(1)

const signContentAssetAddresses = Effect.fn('LearningContent.signContentAssetAddresses')(
  function* (contents: ReadonlyArray<RichContent>) {
    const contentAssetReader = yield* ContentAssetReader
    const fileStorage = yield* FileStorage

    const locations = yield* contentAssetReader.locations(
      Arr.dedupe(contents.flatMap(imageAssetIds)),
    )

    const addresses = yield* Effect.forEach(locations, location =>
      Effect.map(
        fileStorage.signedGetUrl(location.storageKey, contentAssetAddressLifetime),
        url => [location.id, url] as const,
      ),
    )

    return new Map<ContentAssetId, string>(addresses)
  },
  Effect.catch(error =>
    Effect.logWarning('Content asset addresses are unavailable', error.cause).pipe(
      Effect.as(new Map<ContentAssetId, string>()),
    ),
  ),
)

export const withContentAssetAddresses =
  <A, B>(
    contentsOf: (value: A) => ReadonlyArray<RichContent>,
    toDto: (value: A, addresses: ContentAssetAddresses) => B,
  ) =>
  (value: A) =>
    Effect.map(signContentAssetAddresses(contentsOf(value)), addresses => toDto(value, addresses))
