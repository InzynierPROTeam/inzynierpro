import { UserId } from '@inzpro/domain/modules/identity/user'
import { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import {
  oralQuestionDetailsQueryOptions,
  oralDailyPlanQueryOptions,
  oralFavoritesPreviewQueryOptions,
  oralFavoritesSessionQueryOptions,
  oralSessionQuestionQueryOptions,
  oralSessionQueryOptions,
  oralSessionQuizQueryOptions,
  oralQuizChecksInfiniteQueryOptions,
  oralReviewPreviewQueryOptions,
  oralReviewSessionQueryOptions,
} from '~queries/modules/oral-study/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

import { oralStudyKeys } from './keys.js'

const noMaterialPlan = {
  status: 'no_material',
  settings: { version: 1, preference: { mode: 'default' } },
} as const

const oralCategoryId = OralQuestionCategoryId.make('32000000-0000-4000-8000-000000000001')

const pathA = QualificationPathId.make('10000000-0000-4000-8000-000000000001')

const pathB = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

const userId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000001')

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
            questionScope: 'path',
            category: { id: oralCategoryId, name: 'Test category' },
            dueQuestionCount: 2,
            nextDueAt: null,
            settings: {
              defaultQuestionCount: 2,
              minimumQuestionCount: 1,
              maximumQuestionCount: 2,
              canChangeQuestionCount: true,
            },
            reportedInMyChamberQuestionCount: null,
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
          queryKey: oralStudyKeys.oralProgress(userId, pathA),
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
          queryKey: oralStudyKeys.oralQuestions(userId),
          refetchType: 'none',
        })

        for (const scope of queries) {
          expect(client.getQueryState(scope.question.queryKey)?.isInvalidated).toBe(true)
          expect(client.getQueryState(scope.preview.queryKey)?.isInvalidated).toBe(false)
          expect(client.getQueryState(scope.session.queryKey)?.isInvalidated).toBe(false)
          expect(client.getQueryState(scope.unfinished.queryKey)?.isInvalidated).toBe(false)
        }

        await client.invalidateQueries({
          queryKey: oralStudyKeys.oralFavorites(userId),
          refetchType: 'none',
        })

        for (const scope of queries) {
          expect(client.getQueryState(scope.preview.queryKey)?.isInvalidated).toBe(true)
        }

        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherFavorites.queryKey)?.isInvalidated).toBe(false)
        await client.invalidateQueries({
          queryKey: oralStudyKeys.oralProgress(userId, pathA),
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
          queryKey: oralStudyKeys.oralSession(userId, pathA, sessionId),
          refetchType: 'none',
        })
        expect(client.getQueryState(quiz.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(checks.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(other.queryKey)?.isInvalidated).toBe(false)
      }),
  )
})

test('the oral daily plan refreshes with oral progress and stays per account and path', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/oral/daily-plan`,
        HttpServerResponse.jsonUnsafe(noMaterialPlan),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const plan = oralDailyPlanQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA },
        })

        const otherPath = oralDailyPlanQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathB },
        })

        const fetched = await client.query(plan)

        expect(fetched).toEqual(noMaterialPlan)
        client.setQueryData(otherPath.queryKey, fetched)
        await client.invalidateQueries({
          queryKey: oralStudyKeys.oralProgress(userId, pathA),
          refetchType: 'none',
        })
        expect(client.getQueryState(plan.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(otherPath.queryKey)?.isInvalidated).toBe(false)
      }),
  ))

test('an oral question details reads through the oral questions group, so a mark or a note refreshes it', () => {
  const questionId = OralQuestionId.make('c0000000-0000-4000-8000-000000000002')

  const text = {
    content: { version: 1, doc: { type: 'doc', content: [{ type: 'paragraph' }] } },
    assets: [],
  }

  return withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/oral/questions/${questionId}`,
        HttpServerResponse.jsonUnsafe({
          questionId,
          oralRevisionId: 'c1000000-0000-4000-8000-000000000002',
          body: text,
          answer: text,
          references: [],
          isFavorite: false,
          note: null,
          myChamberSourceKinds: [],
        }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const read = oralQuestionDetailsQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA, questionId },
        })

        expect(await client.query(read)).toMatchObject({ questionId, isFavorite: false })

        await client.invalidateQueries({
          queryKey: oralStudyKeys.oralFavorites(userId),
          refetchType: 'none',
        })
        expect(client.getQueryState(read.queryKey)?.isInvalidated).toBe(false)

        await client.invalidateQueries({
          queryKey: oralStudyKeys.oralQuestions(userId),
          refetchType: 'none',
        })
        expect(client.getQueryState(read.queryKey)?.isInvalidated).toBe(true)
      }),
  )
})
