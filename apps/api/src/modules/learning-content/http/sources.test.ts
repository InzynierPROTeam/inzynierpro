import { readFile } from 'node:fs/promises'

import {
  DocumentPackageCandidatesResponse,
  DocumentPdfResponse,
  DocumentSectionsResponse,
  ReferenceDocumentResponse,
  ReferenceDocumentSummary,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { richContentNodeFixtures } from '@inzpro/rich-content/fixtures'
import { paragraphs } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import {
  addFixtureAsset,
  addFixturePdfAsset,
  addFixtureReferenceDocument,
  contentWithImage,
  expectStoredImageAddress,
  fixturePdfBytes,
} from '~api/test/content-fixtures.js'
import { createStudyFixture } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const sourcesRequest = (visitor: TestVisitor, path: string) =>
  visitor.jar.fetch(new URL(`/api/v1/sources${path}`, api.baseUrl))

const onboardedLearner = async () => {
  const learner = await loginForPreparation(api)
  const fixture = await createStudyFixture()

  await learningRequest(
    api,
    learner,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  return { learner, pathId: fixture.pathId }
}

const ListedPage = Schema.Struct({
  data: Schema.Array(ReferenceDocumentSummary),
  meta: Schema.Struct({ nextCursor: Schema.NullOr(Schema.String) }),
})

const listedDocuments = async (visitor: TestVisitor, pathId: QualificationPathId) => {
  const documents: Array<ReferenceDocumentSummary> = []
  let cursor: string | undefined

  do {
    const query = new URLSearchParams({ limit: '50' })

    if (cursor !== undefined) {
      query.set('cursor', cursor)
    }

    const response = await sourcesRequest(visitor, `/paths/${pathId}/documents?${query.toString()}`)

    expect(response.status).toBe(200)

    const page = Schema.decodeUnknownSync(ListedPage)(await response.json())
    documents.push(...page.data)
    cursor = page.meta.nextCursor ?? undefined
  } while (cursor !== undefined)

  return documents
}

test('the sources list shows only the path documents whose current edition is published', async () => {
  const { learner, pathId } = await onboardedLearner()
  const published = await addFixtureReferenceDocument(pathId)
  const unpublished = await addFixtureReferenceDocument(pathId, { published: false })
  const elsewhere = await addFixtureReferenceDocument(undefined)

  const documents = await listedDocuments(learner, pathId)
  const codes = documents.map(document => document.code)

  expect(documents).toContainEqual({
    id: published.id,
    code: published.code,
    kind: 'statute',
    abbreviation: 'TEST',
    title: published.title,
    editionLabel: `Test-only edition ${published.editionId}`,
  })
  expect(codes).not.toContain(unpublished.code)
  expect(codes).not.toContain(elsewhere.code)
})

test('a document reads with its edition availability, text kind and download flag', async () => {
  const { learner, pathId } = await onboardedLearner()

  const standard = await addFixtureReferenceDocument(pathId, {
    availability: 'metadata_only',
    description: 'Norma dostępna wyłącznie w katalogu wydawcy.',
  })

  const response = await sourcesRequest(learner, `/paths/${pathId}/documents/${standard.code}`)

  expect(response.status).toBe(200)
  expect(Schema.decodeUnknownSync(ReferenceDocumentResponse)(await response.json())).toEqual({
    document: {
      id: standard.id,
      code: standard.code,
      kind: 'statute',
      abbreviation: 'TEST',
      title: standard.title,
      description: 'Norma dostępna wyłącznie w katalogu wydawcy.',
      edition: {
        id: standard.editionId,
        label: `Test-only edition ${standard.editionId}`,
        textKind: 'official_consolidated',
        effectiveFrom: '2024-05-01T00:00:00.000Z',
        externalUrl: 'https://isap.sejm.gov.pl/',
        availability: 'metadata_only',
        downloadable: false,
      },
    },
  })
})

test('documents outside the path and unpublished editions are not readable', async () => {
  const { learner, pathId } = await onboardedLearner()
  const unpublished = await addFixtureReferenceDocument(pathId, { published: false })
  const elsewhere = await addFixtureReferenceDocument(undefined)

  for (const { code } of [unpublished, elsewhere]) {
    const response = await sourcesRequest(learner, `/paths/${pathId}/documents/${code}`)

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ type: 'reference_document_not_found' })
  }
})

test('a learner without the path cannot list or read its documents', async () => {
  const { pathId } = await onboardedLearner()
  const document = await addFixtureReferenceDocument(pathId)
  const outsider = await loginForPreparation(api)

  const list = await sourcesRequest(outsider, `/paths/${pathId}/documents`)
  const read = await sourcesRequest(outsider, `/paths/${pathId}/documents/${document.code}`)
  const documentPackage = await sourcesRequest(outsider, `/paths/${pathId}/document-package`)

  expect(list.status).toBe(403)
  expect(read.status).toBe(403)
  expect(documentPackage.status).toBe(403)
})

const sectionsOf = async (visitor: TestVisitor, pathId: QualificationPathId, code: string) => {
  const response = await sourcesRequest(visitor, `/paths/${pathId}/documents/${code}/sections`)

  expect(response.status).toBe(200)

  return Schema.decodeUnknownSync(DocumentSectionsResponse)(await response.json()).sections
}

test('a full-content document reads its units in document order with parents, titles, tables and signed images', async () => {
  const { learner, pathId } = await onboardedLearner()
  const assetId = await addFixtureAsset()

  const statute = await addFixtureReferenceDocument(pathId, {
    sections: [
      { address: 'rozdz:1', title: 'Przepisy ogólne' },
      { address: 'rozdz:2', title: 'Warunki techniczne' },
      { address: 'art:2', parentAddress: 'rozdz:2', content: richContentNodeFixtures.table },
      { address: 'art:1', parentAddress: 'rozdz:1', content: paragraphs('Ustawa normuje.') },
      { address: 'art:1/ust:1', parentAddress: 'art:1', content: paragraphs('Ust. 1.') },
      { address: 'art:1/ust:2', parentAddress: 'art:1', content: contentWithImage(assetId) },
    ],
  })

  const sections = await sectionsOf(learner, pathId, statute.code)

  expect(sections.map(section => [section.address, section.parentAddress])).toEqual([
    ['rozdz:1', null],
    ['art:1', 'rozdz:1'],
    ['art:1/ust:1', 'art:1'],
    ['art:1/ust:2', 'art:1'],
    ['rozdz:2', null],
    ['art:2', 'rozdz:2'],
  ])
  expect(sections[0]).toEqual({
    address: 'rozdz:1',
    parentAddress: null,
    title: 'Przepisy ogólne',
    content: null,
  })
  expect(sections[5]?.content?.content).toEqual(richContentNodeFixtures.table)
  await expectStoredImageAddress(
    sections[3]?.content ?? { content: paragraphs('-'), assets: [] },
    assetId,
  )
})

test('units of a metadata-only, unpublished or unassigned document are not readable', async () => {
  const { learner, pathId } = await onboardedLearner()
  const section = { address: 'art:1', content: paragraphs('Treść.') }

  const documents = [
    await addFixtureReferenceDocument(pathId, {
      availability: 'metadata_only',
      sections: [section],
    }),
    await addFixtureReferenceDocument(pathId, { published: false, sections: [section] }),
    await addFixtureReferenceDocument(undefined, { sections: [section] }),
  ]

  for (const { code } of documents) {
    const response = await sourcesRequest(learner, `/paths/${pathId}/documents/${code}/sections`)

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ type: 'reference_document_not_found' })
  }

  const outsider = await loginForPreparation(api)

  const outsiderRead = await sourcesRequest(
    outsider,
    `/paths/${pathId}/documents/${documents[0]?.code}/sections`,
  )

  expect(outsiderRead.status).toBe(403)
})

const pdfAddressOf = async (response: Response) => {
  expect(response.status).toBe(200)

  return Schema.decodeUnknownSync(DocumentPdfResponse)(await response.json()).url
}

test('a PDF-only document opens its stored PDF through a signed address', async () => {
  const { learner, pathId } = await onboardedLearner()

  const statute = await addFixtureReferenceDocument(pathId, {
    availability: 'pdf_only',
    pdfAssetId: await addFixturePdfAsset(),
  })

  const url = await pdfAddressOf(
    await sourcesRequest(learner, `/paths/${pathId}/documents/${statute.code}/pdf`),
  )

  const pdf = await fetch(url)

  expect(pdf.status).toBe(200)
  expect(new Uint8Array(await pdf.arrayBuffer())).toEqual(fixturePdfBytes)
})

test('a PDF download is refused unless the edition allows downloading', async () => {
  const { learner, pathId } = await onboardedLearner()

  const statute = await addFixtureReferenceDocument(pathId, {
    availability: 'pdf_only',
    pdfAssetId: await addFixturePdfAsset(),
  })

  const response = await sourcesRequest(
    learner,
    `/paths/${pathId}/documents/${statute.code}/pdf/download`,
  )

  expect(response.status).toBe(403)
  expect(await response.json()).toMatchObject({ type: 'document_download_not_allowed' })
})

test('a downloadable PDF is issued as an attachment named after the document', async () => {
  const { learner, pathId } = await onboardedLearner()

  const statute = await addFixtureReferenceDocument(pathId, {
    availability: 'pdf_only',
    pdfAssetId: await addFixturePdfAsset(),
    downloadable: true,
  })

  const url = await pdfAddressOf(
    await sourcesRequest(learner, `/paths/${pathId}/documents/${statute.code}/pdf/download`),
  )

  const pdf = await fetch(url)

  expect(pdf.status).toBe(200)
  expect(pdf.headers.get('content-disposition')).toBe(`attachment; filename="${statute.code}.pdf"`)
  expect(new Uint8Array(await pdf.arrayBuffer())).toEqual(fixturePdfBytes)
})

test('a full-content edition with a PDF also opens and downloads it', async () => {
  const { learner, pathId } = await onboardedLearner()

  const statute = await addFixtureReferenceDocument(pathId, {
    pdfAssetId: await addFixturePdfAsset(),
    downloadable: true,
  })

  for (const file of ['pdf', 'pdf/download']) {
    const url = await pdfAddressOf(
      await sourcesRequest(learner, `/paths/${pathId}/documents/${statute.code}/${file}`),
    )

    const pdf = await fetch(url)

    expect(new Uint8Array(await pdf.arrayBuffer())).toEqual(fixturePdfBytes)
  }
})

test('the PDF of a metadata-only, unpublished or unassigned document is not issued', async () => {
  const { learner, pathId } = await onboardedLearner()

  const documents = [
    await addFixtureReferenceDocument(pathId, {
      availability: 'metadata_only',
      pdfAssetId: await addFixturePdfAsset(),
    }),
    await addFixtureReferenceDocument(pathId, {
      availability: 'pdf_only',
      pdfAssetId: await addFixturePdfAsset(),
      downloadable: true,
      published: false,
    }),
    await addFixtureReferenceDocument(undefined, {
      availability: 'pdf_only',
      pdfAssetId: await addFixturePdfAsset(),
      downloadable: true,
    }),
  ]

  for (const { code } of documents) {
    for (const file of ['pdf', 'pdf/download']) {
      const response = await sourcesRequest(learner, `/paths/${pathId}/documents/${code}/${file}`)

      expect(response.status).toBe(404)
      expect(await response.json()).toMatchObject({ type: 'reference_document_not_found' })
    }
  }

  const outsider = await loginForPreparation(api)

  const outsiderRead = await sourcesRequest(
    outsider,
    `/paths/${pathId}/documents/${documents[0]?.code}/pdf`,
  )

  expect(outsiderRead.status).toBe(403)
})

const packageCandidates = async (visitor: TestVisitor, pathId: QualificationPathId) => {
  const response = await sourcesRequest(visitor, `/paths/${pathId}/document-package`)

  expect(response.status).toBe(200)

  return Schema.decodeUnknownSync(DocumentPackageCandidatesResponse)(await response.json())
    .documents
}

const seedAssetSize = async (file: string) =>
  (await readFile(new URL(`../../../seed/assets/${file}`, import.meta.url))).byteLength

test('the seeded editions are package candidates in path order with their availability, page count and size, and the sources list follows the same order', async () => {
  const { learner, pathId } = await onboardedLearner()
  const seededCodes = ['prawo-budowlane', 'warunki-techniczne', 'samorzady-zawodowe', 'pn-en-1990']

  const candidates = (await packageCandidates(learner, pathId)).filter(candidate =>
    seededCodes.includes(candidate.code),
  )

  expect(
    candidates.map(({ code, abbreviation, kind, textKind, availability, pdf }) => ({
      code,
      abbreviation,
      kind,
      textKind,
      availability,
      pdf,
    })),
  ).toEqual([
    {
      code: 'prawo-budowlane',
      abbreviation: 'PB',
      kind: 'statute',
      textKind: 'official_consolidated',
      availability: 'included',
      pdf: { pageCount: 8, size: await seedAssetSize('building-law-excerpt.pdf') },
    },
    {
      code: 'warunki-techniczne',
      abbreviation: 'WT',
      kind: 'regulation',
      textKind: 'official_consolidated',
      availability: 'download_not_allowed',
      pdf: { pageCount: 3, size: await seedAssetSize('technical-conditions-excerpt.pdf') },
    },
    {
      code: 'samorzady-zawodowe',
      abbreviation: 'USZ',
      kind: 'statute',
      textKind: 'official_consolidated',
      availability: 'included',
      pdf: {
        pageCount: 6,
        size: await seedAssetSize('professional-self-government-chapter-1.pdf'),
      },
    },
    {
      code: 'pn-en-1990',
      abbreviation: 'PN-EN 1990',
      kind: 'standard',
      textKind: 'original',
      availability: 'metadata_only',
      pdf: null,
    },
  ])
  expect(
    (await listedDocuments(learner, pathId)).flatMap(({ code }) =>
      seededCodes.includes(code) ? [code] : [],
    ),
  ).toEqual(seededCodes)
})

test('documents attached later follow the path order, and candidates give the reason a document cannot be included', async () => {
  const { learner, pathId } = await onboardedLearner()

  const fixtures = [
    await addFixtureReferenceDocument(pathId, {
      pdfAssetId: await addFixturePdfAsset({ pageCount: 12 }),
      downloadable: true,
    }),
    await addFixtureReferenceDocument(pathId, {
      availability: 'pdf_only',
      pdfAssetId: await addFixturePdfAsset({ pageCount: 4 }),
    }),
    await addFixtureReferenceDocument(pathId),
    await addFixtureReferenceDocument(pathId, {
      availability: 'metadata_only',
      pdfAssetId: await addFixturePdfAsset({ pageCount: 2 }),
      downloadable: true,
    }),
  ]

  const unpublished = await addFixtureReferenceDocument(pathId, {
    pdfAssetId: await addFixturePdfAsset(),
    downloadable: true,
    published: false,
  })

  const elsewhere = await addFixtureReferenceDocument(undefined, {
    pdfAssetId: await addFixturePdfAsset(),
    downloadable: true,
  })

  const candidates = await packageCandidates(learner, pathId)
  const codes = candidates.map(candidate => candidate.code)

  const fixtureCandidates = candidates.filter(candidate =>
    fixtures.some(fixture => fixture.code === candidate.code),
  )

  expect(fixtureCandidates.map(candidate => candidate.code)).toEqual(
    fixtures.map(fixture => fixture.code),
  )
  expect(codes).not.toContain(unpublished.code)
  expect(codes).not.toContain(elsewhere.code)
  expect(
    fixtures.map(fixture => fixtureCandidates.find(candidate => candidate.code === fixture.code)),
  ).toEqual([
    {
      id: fixtures[0]?.id,
      code: fixtures[0]?.code,
      kind: 'statute',
      abbreviation: 'TEST',
      title: fixtures[0]?.title,
      editionLabel: `Test-only edition ${fixtures[0]?.editionId}`,
      textKind: 'official_consolidated',
      availability: 'included',
      pdf: { pageCount: 12, size: fixturePdfBytes.byteLength },
    },
    expect.objectContaining({
      availability: 'download_not_allowed',
      pdf: { pageCount: 4, size: fixturePdfBytes.byteLength },
    }),
    expect.objectContaining({ availability: 'no_pdf', pdf: null }),
    expect.objectContaining({
      availability: 'metadata_only',
      pdf: { pageCount: 2, size: fixturePdfBytes.byteLength },
    }),
  ])
})

test('a download address is issued for every included package candidate and refused for the rest', async () => {
  const { learner, pathId } = await onboardedLearner()

  for (const candidate of await packageCandidates(learner, pathId)) {
    const response = await sourcesRequest(
      learner,
      `/paths/${pathId}/documents/${candidate.code}/pdf/download`,
    )

    expect({ code: candidate.code, status: response.status }).toEqual({
      code: candidate.code,
      status: candidate.availability === 'included' ? 200 : expect.toBeOneOf([403, 404]),
    })
  }
})
