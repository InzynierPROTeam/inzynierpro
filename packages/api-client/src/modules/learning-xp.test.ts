import { withHttpServer } from '@inzpro/testing/http'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { getLearningXp } from '~api-client/modules/learning-xp.js'

const learningXp = {
  total: 8,
  badges: [{ code: 'streak_7', earnedAt: '2026-11-13T12:00:00.000Z' }],
}

test('the account learning XP is read from the shared contract', () =>
  withHttpServer(
    [HttpRouter.route('GET', '/api/v1/learning-xp', HttpServerResponse.jsonUnsafe(learningXp))],
    async ({ httpClient }) => {
      expect(await runApi(getLearningXp(), httpClient)).toEqual(learningXp)
    },
  ))
