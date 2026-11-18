import { withHttpServer } from '@inzpro/testing/http'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { getStreak } from '~api-client/modules/streak.js'

const streak = {
  currentStreak: 3,
  longestStreak: 8,
  todayAnswerCount: 2,
  dailyAnswerThreshold: 5,
  todayQualifies: false,
  bridgeCount: 2,
  bridgeLimit: 5,
  pendingBridgeCount: 1,
}

test('the account streak is read from the shared contract', () =>
  withHttpServer(
    [HttpRouter.route('GET', '/api/v1/streak', HttpServerResponse.jsonUnsafe(streak))],
    async ({ httpClient }) => {
      expect(await runApi(getStreak(), httpClient)).toEqual(streak)
    },
  ))
