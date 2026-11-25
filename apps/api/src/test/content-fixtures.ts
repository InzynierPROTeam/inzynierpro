import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import type { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
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
import { withSiblingPositions } from '~api/modules/learning-content/domain/document-section.rules.js'
import {
  ContentAsset,
  DocumentSectionContent,
  type ReferenceDocument,
  SectionRelocation,
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

export const fixturePdfBytes = new TextEncoder().encode('%PDF-1.4\n%test-only document\n')

export const addFixturePdfAsset = ({ pageCount = 1 }: { readonly pageCount?: number } = {}) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const fileStorage = yield* FileStorage

      const asset = yield* Schema.decodeEffect(ContentAsset)({
        id: crypto.randomUUID(),
        storageKey: `test/${crypto.randomUUID()}.pdf`,
        mediaType: 'application/pdf',
        size: fixturePdfBytes.byteLength,
        pageCount,
      })

      yield* fileStorage.put({
        key: asset.storageKey,
        mediaType: asset.mediaType,
        body: fixturePdfBytes,
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

type FixtureSection = {
  readonly address: string
  readonly parentAddress?: string
  readonly position?: number
  readonly title?: string
  readonly content?: unknown
}

type FixtureEdition = {
  readonly availability?: ContentAvailability
  readonly published?: boolean
  readonly description?: string
  readonly sections?: ReadonlyArray<FixtureSection>
  readonly pdfAssetId?: ContentAssetId
  readonly downloadable?: boolean
}

const saveSectionContent = (editionId: DocumentEditionId, section: FixtureSection) =>
  Effect.gen(function* () {
    const learningContentRepository = yield* LearningContentRepository

    const sectionContent = yield* Schema.decodeUnknownEffect(DocumentSectionContent)({
      editionId,
      address: section.address,
      parentAddress: section.parentAddress ?? null,
      position: section.position ?? 1,
      title: section.title ?? null,
      content: section.content ?? null,
    })

    yield* learningContentRepository.saveSectionContent(sectionContent)
  })

export const saveFixtureSectionContent = (editionId: DocumentEditionId, section: FixtureSection) =>
  runFixture(saveSectionContent(editionId, section))

export const recordFixtureSectionRelocation = (relocation: {
  readonly editionId: DocumentEditionId
  readonly fromAddress: string
  readonly toAddress: string
  readonly reason: string
}) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      yield* learningContentRepository.recordSectionRelocation(
        yield* Schema.decodeEffect(SectionRelocation)(relocation),
      )
    }),
  )

export const addFixtureReferenceDocument = (
  pathId: QualificationPathId | undefined,
  {
    availability = fullContentAvailability,
    published = true,
    description,
    sections = [],
    pdfAssetId,
    downloadable = false,
  }: FixtureEdition = {},
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
        pdfAssetId: Option.fromUndefinedOr(pdfAssetId),
        availability,
        downloadable,
        published: false,
      })

      for (const section of withSiblingPositions(sections)) {
        yield* saveSectionContent(editionId, section)
      }

      if (published) {
        yield* learningContentRepository.publishEdition(editionId)
      }

      yield* learningContentRepository.makeCurrentEdition(documentId, editionId)

      if (pathId !== undefined) {
        yield* learningContentRepository.attachDocument(pathId, documentId)
      }

      return { ...document, editionId }
    }),
  )
