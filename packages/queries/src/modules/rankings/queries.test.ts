import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { rankingKeys } from '~queries/modules/rankings/keys.js'
import {
  examSessionRankingQueryOptions,
  periodRankingQueryOptions,
} from '~queries/modules/rankings/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const viewerId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')

const examSessionId = Schema.decodeSync(ExamSessionId)('90000000-0000-4000-8000-000000000002')

const ranking = {
  entries: [
    {
      position: 1,
      userId: viewerId,
      name: 'Jan Kowalski',
      image: null,
      xp: 40,
      profileVisible: true,
    },
  ],
  viewer: null,
}

test('rankings are cached per viewing account and period and refreshed through the account group', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/rankings/periods/this_month',
        HttpServerResponse.jsonUnsafe(ranking),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/rankings/exam-sessions/${examSessionId}`,
        HttpServerResponse.jsonUnsafe(ranking),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const periodOptions = periodRankingQueryOptions(httpClient, viewerId, {
          params: { period: 'this_month' },
        })

        const sessionOptions = examSessionRankingQueryOptions(httpClient, viewerId, {
          params: { examSessionId },
        })

        expect(periodOptions.queryKey).toEqual([
          'rankings',
          'account',
          viewerId,
          'getPeriodRanking',
          { params: { period: 'this_month' } },
        ])
        expect(sessionOptions.queryKey).toEqual([
          'rankings',
          'account',
          viewerId,
          'getExamSessionRanking',
          { params: { examSessionId } },
        ])
        expect(await queryClient.query(periodOptions)).toEqual(ranking)
        expect(await queryClient.query(sessionOptions)).toEqual(ranking)

        await queryClient.invalidateQueries({ queryKey: rankingKeys.account(viewerId) })

        expect(queryClient.getQueryState(periodOptions.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(sessionOptions.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
