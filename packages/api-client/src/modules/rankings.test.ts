import { ExamSessionRankingParams } from '@inzpro/api-contracts/modules/rankings/requests'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { getExamSessionRanking, getPeriodRanking } from '~api-client/modules/rankings.js'

const examSessionId = Schema.decodeSync(ExamSessionRankingParams.fields.examSessionId)(
  '90000000-0000-4000-8000-000000000002',
)

const ownRow = {
  position: 101,
  userId: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a',
  name: 'Jan Kowalski',
  image: null,
  xp: 12,
  profileVisible: true,
}

const ranking = {
  entries: [
    {
      position: 1,
      userId: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6b',
      name: 'Anna Nowak',
      image: 'https://example.com/anna.png',
      xp: 640,
      profileVisible: false,
    },
  ],
  viewer: ownRow,
}

test('period and exam-session rankings are read from the shared contract', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/rankings/periods/last_week',
        HttpServerResponse.jsonUnsafe(ranking),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/rankings/exam-sessions/${examSessionId}`,
        HttpServerResponse.jsonUnsafe({ entries: [ownRow], viewer: null }),
      ),
    ],
    async ({ httpClient }) => {
      expect(
        await runApi(getPeriodRanking({ params: { period: 'last_week' } }), httpClient),
      ).toEqual(ranking)
      expect(
        await runApi(getExamSessionRanking({ params: { examSessionId } }), httpClient),
      ).toEqual({ entries: [ownRow], viewer: null })
    },
  ))
