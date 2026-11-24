import {
  ReferenceDocumentResponse,
  ReferenceDocumentSummary,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { addFixtureReferenceDocument } from '~api/test/content-fixtures.js'
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

  expect(list.status).toBe(403)
  expect(read.status).toBe(403)
})
