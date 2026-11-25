import { UserId } from '@inzpro/domain/modules/identity/user'
import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { learningContentKeys } from '~queries/modules/learning-content/keys.js'
import {
  documentPdfQueryOptions,
  documentQuestionCountsQueryOptions,
  linkedOralQuestionsInfiniteQueryOptions,
  linkedWrittenQuestionsInfiniteQueryOptions,
  documentSectionsQueryOptions,
  referenceDocumentQueryOptions,
  referenceDocumentsInfiniteQueryOptions,
} from '~queries/modules/learning-content/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const userId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')
const pathId = Schema.decodeSync(QualificationPathId)('10000000-0000-4000-8000-000000000001')
const code = Schema.decodeSync(ReferenceDocumentCode)('pn-en-1990')
const address = Schema.decodeSync(DocumentSectionAddress)('art:17')
const writtenQuestionId = '30000000-0000-4000-8000-000000000001'
const oralQuestionId = '30000000-0000-4000-8000-000000000002'

const oralBody = {
  content: {
    version: 1,
    doc: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pytanie ustne' }] }],
    },
  },
  assets: [],
}

const summary = {
  id: '20000000-0000-4000-8000-000000000003',
  code,
  kind: 'standard',
  abbreviation: 'PN-EN 1990',
  title: 'Eurokod. Podstawy projektowania konstrukcji',
  editionLabel: 'PN-EN 1990:2004',
}

const document = {
  id: summary.id,
  code,
  kind: summary.kind,
  abbreviation: summary.abbreviation,
  title: summary.title,
  description: 'Opis normy.',
  edition: {
    id: '21000000-0000-4000-8000-000000000003',
    label: summary.editionLabel,
    textKind: 'original',
    effectiveFrom: '2004-10-31T23:00:00.000Z',
    externalUrl: 'https://www.pkn.pl/',
    availability: 'metadata_only',
    downloadable: false,
  },
}

const sections = [
  {
    address: 'rozdz:2',
    parentAddress: null,
    title: 'Uczestnicy procesu budowlanego',
    content: null,
  },
  {
    address: 'art:17',
    parentAddress: 'rozdz:2',
    title: null,
    content: {
      content: {
        version: 1,
        doc: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Treść' }] }],
        },
      },
      assets: [],
    },
  },
]

test('reference documents are cached per account and path and refreshed through the path group', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/sources/paths/${pathId}/documents`,
        HttpServerResponse.jsonUnsafe({ data: [summary], meta: { hasMore: false } }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/sources/paths/${pathId}/documents/${code}`,
        HttpServerResponse.jsonUnsafe({ document }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/sources/paths/${pathId}/documents/${code}/sections`,
        HttpServerResponse.jsonUnsafe({ sections }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/sources/paths/${pathId}/documents/${code}/pdf`,
        HttpServerResponse.jsonUnsafe({
          url: 'https://files.example/document.pdf?X-Amz-Signature=1',
        }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const listRequest = { params: { qualificationPathId: pathId }, query: {} }
        const documentRequest = { params: { qualificationPathId: pathId, code } }
        const list = referenceDocumentsInfiniteQueryOptions(httpClient, userId, listRequest)
        const read = referenceDocumentQueryOptions(httpClient, userId, documentRequest)
        const content = documentSectionsQueryOptions(httpClient, userId, documentRequest)
        const pdf = documentPdfQueryOptions(httpClient, userId, documentRequest)

        expect(list.queryKey).toEqual([
          'learning-content',
          'account',
          userId,
          'path',
          pathId,
          'getReferenceDocumentsInfinite',
          listRequest,
        ])
        expect((await queryClient.infiniteQuery(list)).pages[0]?.data).toEqual([summary])
        expect(await queryClient.query(read)).toEqual({ document })
        expect(await queryClient.query(content)).toEqual({ sections })
        expect(await queryClient.query(pdf)).toEqual({
          url: 'https://files.example/document.pdf?X-Amz-Signature=1',
        })

        await queryClient.invalidateQueries({ queryKey: learningContentKeys.path(userId, pathId) })

        expect(queryClient.getQueryState(list.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(read.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(content.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(pdf.queryKey)?.isInvalidated).toBe(true)
      }),
  ))

test('linked written and oral questions page by cursor apart and stay in the path group with the unit counts', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/sources/paths/${pathId}/documents/${code}/question-counts`,
        HttpServerResponse.jsonUnsafe({
          units: [{ address: 'art:17', writtenQuestionCount: 2, oralQuestionCount: 1 }],
        }),
      ),
      ...(
        [
          ['written-questions', { questionId: writtenQuestionId, body: 'Pytanie' }],
          ['oral-questions', { questionId: oralQuestionId, body: oralBody }],
        ] as const
      ).map(([list, question]) =>
        HttpRouter.route(
          'GET',
          `/api/v1/sources/paths/${pathId}/documents/${code}/${list}`,
          Effect.map(HttpServerRequest.HttpServerRequest, request =>
            HttpServerResponse.jsonUnsafe(
              new URL(request.url, 'http://localhost').searchParams.get('cursor') === null
                ? { data: [question], meta: { hasMore: true, nextCursor: 'next' } }
                : { data: [], meta: { hasMore: false } },
            ),
          ),
        ),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const countsRequest = { params: { qualificationPathId: pathId, code } }
        const listRequest = { ...countsRequest, query: { address } }
        const counts = documentQuestionCountsQueryOptions(httpClient, userId, countsRequest)
        const written = linkedWrittenQuestionsInfiniteQueryOptions(httpClient, userId, listRequest)
        const oral = linkedOralQuestionsInfiniteQueryOptions(httpClient, userId, listRequest)

        expect(written.queryKey).toEqual([
          'learning-content',
          'account',
          userId,
          'path',
          pathId,
          'getLinkedWrittenQuestionsInfinite',
          listRequest,
        ])
        expect(oral.queryKey).not.toStrictEqual(written.queryKey)
        expect(await queryClient.query(counts)).toEqual({
          units: [{ address: 'art:17', writtenQuestionCount: 2, oralQuestionCount: 1 }],
        })

        const writtenPages = await queryClient.infiniteQuery({ ...written, pages: 2 })
        const oralPages = await queryClient.infiniteQuery({ ...oral, pages: 2 })

        expect(writtenPages.pageParams).toStrictEqual([undefined, 'next'])
        expect(writtenPages.pages.flatMap(page => page.data)).toEqual([
          { questionId: writtenQuestionId, body: 'Pytanie' },
        ])
        expect(oralPages.pages.flatMap(page => page.data)).toEqual([
          { questionId: oralQuestionId, body: oralBody },
        ])

        await queryClient.invalidateQueries({ queryKey: learningContentKeys.path(userId, pathId) })

        expect(queryClient.getQueryState(counts.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(written.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(oral.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
