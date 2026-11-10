import { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { preparationKeys, pathsQueryOptions } from '~queries/modules/preparation.js'
import { documentsQueryOptions, sessionPreviewQueryOptions } from '~queries/modules/study.js'
import { withQueryClient } from '~queries/test/query-client.js'

import { studyKeys } from './study.js'

const pathA = Schema.decodeSync(SessionPreview.fields.qualificationPathId)(
  '10000000-0000-4000-8000-000000000001',
)

const pathB = Schema.decodeSync(SessionPreview.fields.qualificationPathId)(
  '10000000-0000-4000-8000-000000000002',
)

const documentId = Schema.decodeSync(SessionPreview.fields.document.fields.id)(
  '20000000-0000-4000-8000-000000000001',
)

const userId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000001')

const document = {
  id: documentId,
  title: 'Test document',
  availableQuestionCount: 2,
  completedQuestionCount: 0,
}

test('a path parent key invalidates its documents and preview while preserving other paths and the path list', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/preparation/paths',
        HttpServerResponse.jsonUnsafe({ data: [], meta: { hasMore: false } }),
      ),
      ...[pathA, pathB].map(id =>
        HttpRouter.route(
          'GET',
          `/api/v1/study/paths/${id}/documents`,
          HttpServerResponse.jsonUnsafe({ data: [document], meta: { hasMore: false } }),
        ),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/documents/${documentId}/preview`,
        HttpServerResponse.jsonUnsafe({
          qualificationPathId: pathA,
          document,
          mode: 'written-study',
          availableQuestionCount: 2,
          settings: {
            defaultQuestionCount: 2,
            canChangeQuestionCount: false,
            minimumQuestionCount: 2,
            maximumQuestionCount: 2,
          },
        }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const paths = pathsQueryOptions(httpClient, userId, { query: {} })

        const documentsA = documentsQueryOptions(httpClient, userId, {
          query: {},
          params: { qualificationPathId: pathA },
        })

        const documentsB = documentsQueryOptions(httpClient, userId, {
          query: {},
          params: { qualificationPathId: pathB },
        })

        const otherUserId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000002')

        const otherAccount = documentsQueryOptions(httpClient, otherUserId, {
          query: {},
          params: { qualificationPathId: pathA },
        })

        const preview = sessionPreviewQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA, documentId },
        })

        await Promise.all([
          client.infiniteQuery(paths),
          client.infiniteQuery(otherAccount),
          client.infiniteQuery(documentsA),
          client.infiniteQuery(documentsB),
          client.query(preview),
        ])
        await client.invalidateQueries({ queryKey: studyKeys.path(userId, pathA) })
        expect(client.getQueryState(documentsA.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(preview.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(documentsB.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(paths.queryKey)?.isInvalidated).toBe(false)
        await client.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
        expect(client.getQueryState(paths.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
