import { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { SessionQuestionPosition, StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { preparationKeys, pathsQueryOptions } from '~queries/modules/preparation.js'
import {
  documentQueryOptions,
  documentsInfiniteQueryOptions,
  sessionPreviewQueryOptions,
} from '~queries/modules/study.js'
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
        `/api/v1/study/paths/${pathA}/documents/${documentId}`,
        HttpServerResponse.jsonUnsafe({ document }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/preview`,
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

        const documentsA = documentsInfiniteQueryOptions(httpClient, userId, {
          query: {},
          params: { qualificationPathId: pathA },
        })

        const documentsB = documentsInfiniteQueryOptions(httpClient, userId, {
          query: {},
          params: { qualificationPathId: pathB },
        })

        const otherUserId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000002')

        const otherAccount = documentsInfiniteQueryOptions(httpClient, otherUserId, {
          query: {},
          params: { qualificationPathId: pathA },
        })

        const category = documentQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA, documentId },
        })

        const foreignCategory = documentQueryOptions(httpClient, otherUserId, {
          params: { qualificationPathId: pathA, documentId },
        })

        expect(category.queryKey).not.toEqual(foreignCategory.queryKey)
        expect(category.queryKey).not.toEqual(documentsA.queryKey)

        const preview = sessionPreviewQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA },
          query: { documentId },
        })

        await Promise.all([
          client.query(paths),
          client.infiniteQuery(otherAccount),
          client.infiniteQuery(documentsA),
          client.infiniteQuery(documentsB),
          client.query(preview),
          client.query(category),
          client.query(foreignCategory),
        ])
        expect(client.getQueryData(category.queryKey)).toEqual({ document })
        await client.invalidateQueries({ queryKey: studyKeys.path(userId, pathA) })
        expect(client.getQueryState(category.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(foreignCategory.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(documentsA.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(preview.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(documentsB.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(paths.queryKey)?.isInvalidated).toBe(false)
        await client.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
        expect(client.getQueryState(paths.queryKey)?.isInvalidated).toBe(true)
      }),
  ))

test('a session group invalidates its own questions while the path group covers every session', () => {
  const sessionA = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const sessionB = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000002')
  const position = Schema.decodeSync(SessionQuestionPosition)(1)

  const questionKey = (sessionId: StudySessionId) =>
    studyKeys.getSessionQuestion(userId, {
      params: { qualificationPathId: pathA, sessionId, position },
    })

  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  expect(startsWith(questionKey(sessionA), studyKeys.session(userId, pathA, sessionA))).toBe(true)
  expect(startsWith(questionKey(sessionB), studyKeys.session(userId, pathA, sessionA))).toBe(false)
  expect(
    startsWith(
      studyKeys.getSession(userId, { params: { qualificationPathId: pathA, sessionId: sessionB } }),
      studyKeys.path(userId, pathA),
    ),
  ).toBe(true)
  expect(
    startsWith(
      studyKeys.getLatestSession(userId, {
        params: { qualificationPathId: pathA },
        query: { documentId },
      }),
      studyKeys.path(userId, pathA),
    ),
  ).toBe(true)
})
