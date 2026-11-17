import { UserId } from '@inzpro/domain/modules/identity/user'
import {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import {
  attemptReviewInfiniteQueryOptions,
  mockExamHistoryInfiniteQueryOptions,
  attemptQuestionQueryOptions,
  mockExamAttemptQueryOptions,
  mockExamPreviewQueryOptions,
} from '~queries/modules/mock-exams/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

import { mockExamKeys } from './keys.js'

const userId = UserId.make('a0000000-0000-4000-8000-000000000001')
const otherUserId = UserId.make('a0000000-0000-4000-8000-000000000002')
const pathA = QualificationPathId.make('10000000-0000-4000-8000-000000000001')
const pathB = QualificationPathId.make('10000000-0000-4000-8000-000000000002')
const attemptId = MockExamAttemptId.make('b0000000-0000-4000-8000-000000000001')

test('mock exam reads refresh with their path group while other accounts and paths keep their cache', () =>
  withHttpServer(
    [pathA, pathB].flatMap(qualificationPathId => [
      HttpRouter.route(
        'GET',
        `/api/v1/mock-exams/paths/${qualificationPathId}/preview`,
        HttpServerResponse.jsonUnsafe({
          qualificationPathId,
          blueprint: null,
          unavailableReason: 'no-blueprint',
          unfinishedAttempt: null,
        }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/mock-exams/paths/${qualificationPathId}/attempts/${attemptId}`,
        HttpServerResponse.jsonUnsafe(null),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/mock-exams/paths/${qualificationPathId}/attempts/${attemptId}/questions/1`,
        HttpServerResponse.jsonUnsafe(null),
      ),
    ]),
    ({ httpClient }) =>
      withQueryClient(async client => {
        const preview = mockExamPreviewQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA },
        })

        const attempt = mockExamAttemptQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA, attemptId },
        })

        const question = attemptQuestionQueryOptions(httpClient, userId, {
          params: {
            qualificationPathId: pathA,
            attemptId,
            position: AttemptQuestionPosition.make(1),
          },
        })

        const otherAccount = mockExamPreviewQueryOptions(httpClient, otherUserId, {
          params: { qualificationPathId: pathA },
        })

        const otherPath = mockExamPreviewQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathB },
        })

        expect(await client.query(preview)).toMatchObject({ unavailableReason: 'no-blueprint' })
        expect(await client.query(attempt)).toBeNull()
        expect(await client.query(question)).toBeNull()
        await client.query(otherAccount)
        await client.query(otherPath)

        await client.invalidateQueries({
          queryKey: mockExamKeys.path(userId, pathA),
          refetchType: 'none',
        })

        expect(client.getQueryState(preview.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(attempt.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(question.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherPath.queryKey)?.isInvalidated).toBe(false)
      }),
  ))

test('review and history follow cursor pages and retain separate account, path and attempt caches', () =>
  withHttpServer(
    (
      [
        `/api/v1/mock-exams/paths/${pathA}/history`,
        `/api/v1/mock-exams/paths/${pathA}/attempts/${attemptId}/review`,
      ] as const
    ).map(path =>
      HttpRouter.route(
        'GET',
        path,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          const cursor = new URL(request.url, 'http://localhost').searchParams.get('cursor')

          expect(cursor === null || cursor === 'next').toBe(true)

          return HttpServerResponse.jsonUnsafe(
            cursor === null
              ? { data: [], meta: { hasMore: true, nextCursor: 'next' } }
              : { data: [], meta: { hasMore: false } },
          )
        }),
      ),
    ),
    ({ httpClient }) =>
      withQueryClient(async client => {
        const history = mockExamHistoryInfiniteQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA },
          query: {},
        })

        const reviewRequest = { params: { qualificationPathId: pathA, attemptId }, query: {} }
        const review = attemptReviewInfiniteQueryOptions(httpClient, userId, reviewRequest)
        const foreign = attemptReviewInfiniteQueryOptions(httpClient, otherUserId, reviewRequest)

        const anotherAttempt = attemptReviewInfiniteQueryOptions(httpClient, userId, {
          ...reviewRequest,
          params: {
            ...reviewRequest.params,
            attemptId: MockExamAttemptId.make('b0000000-0000-4000-8000-000000000002'),
          },
        })

        const anotherPath = mockExamHistoryInfiniteQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathB },
          query: {},
        })

        expect(review.queryKey).not.toStrictEqual(anotherAttempt.queryKey)
        expect(history.queryKey).not.toStrictEqual(anotherPath.queryKey)
        expect((await client.infiniteQuery({ ...review, pages: 2 })).pageParams).toStrictEqual([
          undefined,
          'next',
        ])
        expect((await client.infiniteQuery({ ...history, pages: 2 })).pageParams).toStrictEqual([
          undefined,
          'next',
        ])
        await client.infiniteQuery(foreign)
        await client.invalidateQueries({
          queryKey: mockExamKeys.review(userId, pathA, attemptId),
          refetchType: 'none',
        })
        expect(client.getQueryState(review.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(history.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(foreign.queryKey)?.isInvalidated).toBe(false)
        await client.invalidateQueries({
          queryKey: mockExamKeys.path(userId, pathA),
          refetchType: 'none',
        })
        expect(client.getQueryState(history.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
