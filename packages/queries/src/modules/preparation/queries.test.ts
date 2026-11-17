import { UserId } from '@inzpro/domain/modules/identity/user'
import { withHttpServer } from '@inzpro/testing/http'
import { dehydrate, hydrate } from '@tanstack/react-query'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { preparationKeys } from '~queries/modules/preparation/keys.js'
import {
  pathsQueryOptions,
  pathsInfiniteQueryOptions,
} from '~queries/modules/preparation/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const userId = UserId.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')
const otherUserId = UserId.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6b')

test('normal and infinite path queries keep separate cache entries under the same account group', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/preparation/paths',
        HttpServerResponse.jsonUnsafe({ data: [], meta: { hasMore: false } }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const normal = pathsQueryOptions(httpClient, userId, { query: {} })
        const infinite = pathsInfiniteQueryOptions(httpClient, userId, { query: {} })
        const other = pathsQueryOptions(httpClient, otherUserId, { query: {} })

        expect(normal.queryKey).not.toEqual(infinite.queryKey)
        expect(await client.query(normal)).toEqual({ data: [], meta: { hasMore: false } })
        expect(await client.infiniteQuery(infinite)).toMatchObject({
          pages: [{ data: [], meta: { hasMore: false } }],
        })
        await client.query(other)
        await client.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
        expect(client.getQueryState(normal.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(infinite.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(other.queryKey)?.isInvalidated).toBe(false)
      }),
  ))

test('HTTP goal dates stay ISO and null through query cache hydration', () => {
  const path = {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Konstrukcyjno-budowlana',
    specialization: {
      description: null,
      code: 'konstrukcyjno-budowlana',
      id: '60000000-0000-4000-8000-000000000001',
      name: 'Konstrukcyjno-budowlana',
    },
    qualificationKind: {
      code: 'kierowanie',
      id: '70000000-0000-4000-8000-000000000001',
      name: 'Kierowanie robotami budowlanymi',
    },
    qualificationScope: {
      code: 'bez-ograniczen',
      id: '80000000-0000-4000-8000-000000000001',
      name: 'Bez ograniczeń',
    },
    accessScope: 'both',
    archived: false,
    districtChamber: null,
    goal: {
      version: 1,
      examSessionId: '90000000-0000-4000-8000-000000000001',
      sessionName: 'Wiosna 2026',
      sessionIsConfirmed: true,
      writtenAt: '2026-05-15T08:00:00.000Z',
      oralPlanningAt: '2026-05-18T08:00:00.000Z',
      oralExamDate: null,
      accessScope: 'both',
    },
  }

  return withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/preparation/paths',
        HttpServerResponse.jsonUnsafe({ data: [path], meta: { hasMore: false } }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async server => {
        const options = pathsQueryOptions(httpClient, userId, { query: {} })
        const data = await server.query(options)
        expect(data.data[0]?.goal).toEqual(path.goal)
        const snapshot = JSON.parse(JSON.stringify(dehydrate(server)))
        await withQueryClient(async browser => {
          hydrate(browser, snapshot)
          const hydrated = browser.getQueryData(options.queryKey)
          expect(hydrated).toEqual(data)
          expect(hydrated?.data[0]?.goal.writtenAt).toBe(path.goal.writtenAt)
          expect(hydrated?.data[0]?.goal.oralExamDate).toBeNull()
        })
      }),
  )
})
