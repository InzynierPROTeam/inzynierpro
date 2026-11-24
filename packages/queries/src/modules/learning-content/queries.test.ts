import { UserId } from '@inzpro/domain/modules/identity/user'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { learningContentKeys } from '~queries/modules/learning-content/keys.js'
import {
  referenceDocumentQueryOptions,
  referenceDocumentsInfiniteQueryOptions,
} from '~queries/modules/learning-content/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const userId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')
const pathId = Schema.decodeSync(QualificationPathId)('10000000-0000-4000-8000-000000000001')
const code = Schema.decodeSync(ReferenceDocumentCode)('pn-en-1990')

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
    ],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const listRequest = { params: { qualificationPathId: pathId }, query: {} }
        const documentRequest = { params: { qualificationPathId: pathId, code } }
        const list = referenceDocumentsInfiniteQueryOptions(httpClient, userId, listRequest)
        const read = referenceDocumentQueryOptions(httpClient, userId, documentRequest)

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

        await queryClient.invalidateQueries({ queryKey: learningContentKeys.path(userId, pathId) })

        expect(queryClient.getQueryState(list.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(read.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
