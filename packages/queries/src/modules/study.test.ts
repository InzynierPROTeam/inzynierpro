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
          questionSelection: 'uncovered',
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

test('a session group invalidates its own summary while the path group covers every session', () => {
  const sessionA = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const sessionB = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000002')

  const summaryKey = (sessionId: StudySessionId) =>
    studyKeys.getSessionSummary(userId, { params: { qualificationPathId: pathA, sessionId } })

  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  expect(startsWith(summaryKey(sessionA), studyKeys.session(userId, pathA, sessionA))).toBe(true)
  expect(startsWith(summaryKey(sessionB), studyKeys.session(userId, pathA, sessionA))).toBe(false)
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

test('the progress group an answer refreshes covers the review preview and the unfinished review session of every scope', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const progress = studyKeys.progress(userId, pathA)

  for (const query of [{}, { documentId }]) {
    expect(
      startsWith(
        studyKeys.getReviewPreview(userId, { params: { qualificationPathId: pathA }, query }),
        progress,
      ),
    ).toBe(true)
    expect(
      startsWith(
        studyKeys.getReviewSession(userId, { params: { qualificationPathId: pathA }, query }),
        progress,
      ),
    ).toBe(true)
  }

  expect(
    startsWith(
      studyKeys.getReviewPreview(userId, { params: { qualificationPathId: pathB }, query: {} }),
      progress,
    ),
  ).toBe(false)
})

test('the next step after a session refreshes with the progress group, not only with its session', () => {
  const key = studyKeys.getSessionNextStep(userId, {
    params: {
      qualificationPathId: pathA,
      sessionId: Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001'),
    },
  })

  const progress = studyKeys.progress(userId, pathA)

  expect(progress.every((part, index) => key[index] === part)).toBe(true)
})

test('the favourites group a mark refreshes covers every read showing a mark, on every path, and nothing else', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const favorites = studyKeys.favorites(userId)
  const otherUserId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000002')
  const sessionId = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const position = Schema.decodeSync(SessionQuestionPosition)(1)

  for (const qualificationPathId of [pathA, pathB]) {
    for (const query of [{}, { documentId }]) {
      expect(
        startsWith(
          studyKeys.getFavoritesPreview(userId, { params: { qualificationPathId }, query }),
          favorites,
        ),
      ).toBe(true)
    }

    expect(
      startsWith(
        studyKeys.getSessionQuestion(userId, {
          params: { qualificationPathId, sessionId, position },
        }),
        favorites,
      ),
    ).toBe(true)
    // The session itself shows no mark, so a mark leaves it alone.
    expect(
      startsWith(
        studyKeys.getSession(userId, { params: { qualificationPathId, sessionId } }),
        favorites,
      ),
    ).toBe(false)
  }

  expect(
    startsWith(
      studyKeys.getSessionQuestion(otherUserId, {
        params: { qualificationPathId: pathA, sessionId, position },
      }),
      favorites,
    ),
  ).toBe(false)
  expect(startsWith(favorites, studyKeys.account(userId))).toBe(true)
})

test('the unfinished favourites session refreshes with the progress group of its path', () => {
  const key = studyKeys.getFavoritesSession(userId, {
    params: { qualificationPathId: pathA },
    query: {},
  })

  expect(studyKeys.progress(userId, pathA).every((part, index) => key[index] === part)).toBe(true)
})
