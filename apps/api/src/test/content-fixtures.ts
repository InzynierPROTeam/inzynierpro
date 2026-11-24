import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  type ContentAvailability,
  DocumentEditionId,
  fullContentAvailability,
  officialConsolidatedText,
} from '@inzpro/domain/modules/learning-content/document-edition'
import {
  ReferenceDocumentCode,
  ReferenceDocumentId,
  statuteDocument,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option, Schema } from 'effect'
import { expect } from 'vitest'
import { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import {
  ContentAsset,
  type ReferenceDocument,
} from '~api/modules/learning-content/domain/learning-content.model.js'
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

export const fixtureReferenceDocument = (
  id: ReferenceDocumentId,
  title: string,
): ReferenceDocument => ({
  id,
  kind: statuteDocument,
  code: ReferenceDocumentCode.make(`test-${id}`),
  abbreviation: 'TEST',
  title,
  description: Option.none(),
})

type FixtureEdition = {
  readonly availability?: ContentAvailability
  readonly published?: boolean
  readonly description?: string
}

export const addFixtureReferenceDocument = (
  pathId: QualificationPathId | undefined,
  { availability = fullContentAvailability, published = true, description }: FixtureEdition = {},
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const documentId = ReferenceDocumentId.make(crypto.randomUUID())
      const editionId = DocumentEditionId.make(crypto.randomUUID())

      const document = {
        ...fixtureReferenceDocument(documentId, `Test-only source ${documentId}`),
        description: Option.fromNullishOr(description),
      }

      yield* learningContentRepository.createDocument(document)
      yield* learningContentRepository.createEdition({
        id: editionId,
        documentId,
        label: `Test-only edition ${editionId}`,
        textKind: officialConsolidatedText,
        effectiveFrom: DateTime.makeUnsafe('2024-05-01T00:00:00.000Z'),
        externalUrl: 'https://isap.sejm.gov.pl/',
        pdfAssetId: Option.none(),
        availability,
        downloadable: false,
        published,
      })
      yield* learningContentRepository.makeCurrentEdition(documentId, editionId)

      if (pathId !== undefined) {
        yield* learningContentRepository.attachDocument(pathId, documentId)
      }

      return { ...document, editionId }
    }),
  )
