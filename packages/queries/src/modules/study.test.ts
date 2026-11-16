import { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { SessionQuestionPosition, StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { preparationKeys, pathsQueryOptions } from '~queries/modules/preparation.js'
import {
  oralFavoritesPreviewQueryOptions,
  oralFavoritesSessionQueryOptions,
  oralSessionQuestionQueryOptions,
  oralSessionQueryOptions,
  oralSessionQuizQueryOptions,
  oralQuizChecksInfiniteQueryOptions,
  oralReviewPreviewQueryOptions,
  oralReviewSessionQueryOptions,
  documentQueryOptions,
  documentsInfiniteQueryOptions,
  sessionPreviewQueryOptions,
} from '~queries/modules/study.js'
import { withQueryClient } from '~queries/test/query-client.js'

import { studyKeys } from './study.js'

const oralCategoryId = OralQuestionCategoryId.make('32000000-0000-4000-8000-000000000001')

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

test('the favourites group covers the favourites previews on every path, and nothing else', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const favorites = studyKeys.favorites(userId)
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
    ).toBe(false)
  }

  expect(startsWith(favorites, studyKeys.account(userId))).toBe(true)
})

test('the questions group a mark or a note refreshes covers every session question, on every path, and nothing else', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const questions = studyKeys.questions(userId)
  const otherUserId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000002')
  const sessionId = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const position = Schema.decodeSync(SessionQuestionPosition)(1)

  for (const qualificationPathId of [pathA, pathB]) {
    expect(
      startsWith(
        studyKeys.getSessionQuestion(userId, {
          params: { qualificationPathId, sessionId, position },
        }),
        questions,
      ),
    ).toBe(true)
    expect(
      startsWith(
        studyKeys.getSession(userId, { params: { qualificationPathId, sessionId } }),
        questions,
      ),
    ).toBe(false)
    expect(
      startsWith(
        studyKeys.getFavoritesPreview(userId, { params: { qualificationPathId }, query: {} }),
        questions,
      ),
    ).toBe(false)
  }

  expect(
    startsWith(
      studyKeys.getSessionQuestion(otherUserId, {
        params: { qualificationPathId: pathA, sessionId, position },
      }),
      questions,
    ),
  ).toBe(false)
  expect(startsWith(questions, studyKeys.account(userId))).toBe(true)
})

test('the unfinished favourites session refreshes with the progress group of its path', () => {
  const key = studyKeys.getFavoritesSession(userId, {
    params: { qualificationPathId: pathA },
    query: {},
  })

  expect(studyKeys.progress(userId, pathA).every((part, index) => key[index] === part)).toBe(true)
})

test('oral review queries forward category scope and invalidate with oral progress while preserving other accounts and paths', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/oral/review-preview`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          expect(new URL(request.url, 'http://localhost').searchParams.get('categoryId')).toBe(
            oralCategoryId,
          )

          return HttpServerResponse.jsonUnsafe({
            qualificationPathId: pathA,
            category: { id: oralCategoryId, name: 'Test category' },
            dueQuestionCount: 2,
            nextDueAt: null,
            settings: {
              defaultQuestionCount: 2,
              minimumQuestionCount: 1,
              maximumQuestionCount: 2,
              canChangeQuestionCount: true,
            },
          })
        }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/oral/review-session`,
        HttpServerResponse.jsonUnsafe(null),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const request = {
          params: { qualificationPathId: pathA },
          query: { categoryId: oralCategoryId },
        }

        const preview = oralReviewPreviewQueryOptions(httpClient, userId, request)
        const session = oralReviewSessionQueryOptions(httpClient, userId, request)
        const otherUser = UserId.make('a0000000-0000-4000-8000-000000000002')
        const otherAccount = oralReviewPreviewQueryOptions(httpClient, otherUser, request)

        const otherPath = oralReviewPreviewQueryOptions(httpClient, userId, {
          ...request,
          params: { qualificationPathId: pathB },
        })

        const global = oralReviewPreviewQueryOptions(httpClient, userId, { ...request, query: {} })
        expect(preview.queryKey).not.toEqual(global.queryKey)
        expect(await client.query(preview)).toMatchObject({
          dueQuestionCount: 2,
          category: { id: oralCategoryId },
        })
        expect(await client.query(session)).toBeNull()
        client.setQueryData(otherAccount.queryKey, null)
        client.setQueryData(otherPath.queryKey, null)
        await client.invalidateQueries({
          queryKey: studyKeys.oralProgress(userId, pathA),
          refetchType: 'none',
        })
        expect(client.getQueryState(preview.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(session.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherPath.queryKey)?.isInvalidated).toBe(false)
      }),
  ))

test('oral favourites and question queries isolate accounts and invalidate shared marks and notes across paths without refreshing sessions', () => {
  const otherUserId = UserId.make('a0000000-0000-4000-8000-000000000002')
  const sessionId = OralStudySessionId.make('b0000000-0000-4000-8000-000000000001')
  const position = SessionQuestionPosition.make(1)

  return withHttpServer(
    [pathA, pathB].flatMap(qualificationPathId => [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${qualificationPathId}/oral/favorites-preview`,
        HttpServerResponse.jsonUnsafe({
          qualificationPathId,
          favoriteQuestionCount: 0,
          settings: null,
        }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${qualificationPathId}/oral/favorites-session`,
        HttpServerResponse.jsonUnsafe(null),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${qualificationPathId}/oral/sessions/${sessionId}/questions/1`,
        HttpServerResponse.jsonUnsafe(null),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${qualificationPathId}/oral/sessions/${sessionId}`,
        HttpServerResponse.jsonUnsafe(null),
      ),
    ]),
    ({ httpClient }) =>
      withQueryClient(async client => {
        const queries = [pathA, pathB].map(qualificationPathId => ({
          preview: oralFavoritesPreviewQueryOptions(httpClient, userId, {
            params: { qualificationPathId },
          }),
          unfinished: oralFavoritesSessionQueryOptions(httpClient, userId, {
            params: { qualificationPathId },
          }),
          question: oralSessionQuestionQueryOptions(httpClient, userId, {
            params: { qualificationPathId, sessionId, position },
          }),
          session: oralSessionQueryOptions(httpClient, userId, {
            params: { qualificationPathId, sessionId },
          }),
        }))

        const otherAccount = oralSessionQuestionQueryOptions(httpClient, otherUserId, {
          params: { qualificationPathId: pathA, sessionId, position },
        })

        const otherFavorites = oralFavoritesPreviewQueryOptions(httpClient, otherUserId, {
          params: { qualificationPathId: pathA },
        })

        for (const scope of queries) {
          expect(await client.query(scope.preview)).toMatchObject({
            favoriteQuestionCount: 0,
            settings: null,
          })
          expect(await client.query(scope.unfinished)).toBeNull()
          expect(await client.query(scope.question)).toBeNull()
          expect(await client.query(scope.session)).toBeNull()
        }

        await client.query(otherAccount)
        await client.query(otherFavorites)
        await client.invalidateQueries({
          queryKey: studyKeys.oralQuestions(userId),
          refetchType: 'none',
        })

        for (const scope of queries) {
          expect(client.getQueryState(scope.question.queryKey)?.isInvalidated).toBe(true)
          expect(client.getQueryState(scope.preview.queryKey)?.isInvalidated).toBe(false)
          expect(client.getQueryState(scope.session.queryKey)?.isInvalidated).toBe(false)
          expect(client.getQueryState(scope.unfinished.queryKey)?.isInvalidated).toBe(false)
        }

        await client.invalidateQueries({
          queryKey: studyKeys.oralFavorites(userId),
          refetchType: 'none',
        })

        for (const scope of queries) {
          expect(client.getQueryState(scope.preview.queryKey)?.isInvalidated).toBe(true)
        }

        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherFavorites.queryKey)?.isInvalidated).toBe(false)
        await client.invalidateQueries({
          queryKey: studyKeys.oralProgress(userId, pathA),
          refetchType: 'none',
        })
        expect(client.getQueryState(queries[0]!.unfinished.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(queries[1]!.unfinished.queryKey)?.isInvalidated).toBe(false)
      }),
  )
})

test('oral quiz queries belong to their oral session, page through checks and leave other sessions alone', () => {
  const sessionId = OralStudySessionId.make('b0000000-0000-4000-8000-000000000001')
  const otherSessionId = OralStudySessionId.make('b0000000-0000-4000-8000-000000000002')

  return withHttpServer(
    [sessionId, otherSessionId].flatMap(id => [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/oral/sessions/${id}/quiz`,
        HttpServerResponse.jsonUnsafe({ quiz: null, availableFormats: ['true_false'] }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/oral/sessions/${id}/quiz/checks`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          const cursor = new URL(request.url, 'http://localhost').searchParams.get('cursor')

          return HttpServerResponse.jsonUnsafe(
            cursor === null
              ? { data: [], meta: { hasMore: true, nextCursor: 'next' } }
              : { data: [], meta: { hasMore: false } },
          )
        }),
      ),
    ]),
    ({ httpClient }) =>
      withQueryClient(async client => {
        const params = { qualificationPathId: pathA, sessionId }
        const quiz = oralSessionQuizQueryOptions(httpClient, userId, { params })
        const checks = oralQuizChecksInfiniteQueryOptions(httpClient, userId, { params, query: {} })

        const other = oralSessionQuizQueryOptions(httpClient, userId, {
          params: { ...params, sessionId: otherSessionId },
        })

        expect(await client.query(quiz)).toEqual({ quiz: null, availableFormats: ['true_false'] })
        expect((await client.infiniteQuery({ ...checks, pages: 2 })).pageParams).toEqual([
          undefined,
          'next',
        ])
        await client.query(other)
        await client.invalidateQueries({
          queryKey: studyKeys.oralSession(userId, pathA, sessionId),
          refetchType: 'none',
        })
        expect(client.getQueryState(quiz.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(checks.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(other.queryKey)?.isInvalidated).toBe(false)
      }),
  )
})
