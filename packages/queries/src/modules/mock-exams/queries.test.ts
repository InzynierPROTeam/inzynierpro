import { UserId } from '@inzpro/domain/modules/identity/user'
import {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { withHttpServer } from '@inzpro/testing/http'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import {
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
