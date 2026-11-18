import { UserId } from '@inzpro/domain/modules/identity/user'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { learningXpKeys } from '~queries/modules/learning-xp/keys.js'
import { learningXpQueryOptions } from '~queries/modules/learning-xp/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const userId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')

const learningXp = {
  total: 8,
  badges: [{ code: 'streak_7', earnedAt: '2026-11-13T12:00:00.000Z' }],
}

test('the account learning XP is cached per account and refreshed through the account group', () =>
  withHttpServer(
    [HttpRouter.route('GET', '/api/v1/learning-xp', HttpServerResponse.jsonUnsafe(learningXp))],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const options = learningXpQueryOptions(httpClient, userId)

        expect(options.queryKey).toEqual(['learning-xp', 'account', userId, 'getLearningXp', {}])
        expect(await queryClient.query(options)).toEqual(learningXp)

        await queryClient.invalidateQueries({ queryKey: learningXpKeys.account(userId) })

        expect(queryClient.getQueryState(options.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
