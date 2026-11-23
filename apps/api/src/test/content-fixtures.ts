import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Effect, Schema } from 'effect'
import { expect } from 'vitest'
import { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { ContentAsset } from '~api/modules/learning-content/domain/learning-content.model.js'
import { runFixture } from '~api/test/run-fixture.js'

export const fixtureAssetBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export const addFixtureAsset = () =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const fileStorage = yield* FileStorage

      const asset = yield* Schema.decodeEffect(ContentAsset)({
        id: crypto.randomUUID(),
        storageKey: `test/${crypto.randomUUID()}.png`,
        mediaType: 'image/png',
        width: 640,
        height: 480,
        size: fixtureAssetBytes.byteLength,
      })

      yield* fileStorage.put({
        key: asset.storageKey,
        mediaType: asset.mediaType,
        body: fixtureAssetBytes,
      })
      yield* learningContentRepository.createAsset(asset)

      return asset.id
    }),
  )

export const contentWithImage = (assetId: string) =>
  ({
    version: 1,
    doc: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Przekrój' }] },
        { type: 'image', attrs: { assetId, alt: 'Przekrój schodów', caption: null } },
      ],
    },
  }) as const

export const expectStoredImageAddress = async (resolved: ResolvedRichContent, assetId: string) => {
  expect(resolved.assets).toEqual([{ id: assetId, url: expect.any(String) }])

  const image = await fetch(resolved.assets[0]?.url ?? '')

  expect(image.status).toBe(200)
  expect(new Uint8Array(await image.arrayBuffer())).toEqual(fixtureAssetBytes)
}
