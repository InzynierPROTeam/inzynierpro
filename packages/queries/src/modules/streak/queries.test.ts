import { UserId } from '@inzpro/domain/modules/identity/user'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { streakKeys } from '~queries/modules/streak/keys.js'
import { streakQueryOptions } from '~queries/modules/streak/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const userId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')

const streak = {
  currentStreak: 1,
  longestStreak: 4,
  todayAnswerCount: 5,
  dailyAnswerThreshold: 5,
  todayQualifies: true,
  bridgeCount: 0,
  bridgeLimit: 5,
  pendingBridgeCount: 0,
}

test('the account streak is cached per account and refreshed through the account group', () =>
  withHttpServer(
    [HttpRouter.route('GET', '/api/v1/streak', HttpServerResponse.jsonUnsafe(streak))],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const options = streakQueryOptions(httpClient, userId)

        expect(options.queryKey).toEqual(['streak', 'account', userId, 'getStreak', {}])
        expect(await queryClient.query(options)).toEqual(streak)

        await queryClient.invalidateQueries({ queryKey: streakKeys.account(userId) })

        expect(queryClient.getQueryState(options.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
