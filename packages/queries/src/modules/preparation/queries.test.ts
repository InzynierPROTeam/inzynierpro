import { UserId } from '@inzpro/domain/modules/identity/user'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { withHttpServer } from '@inzpro/testing/http'
import { dehydrate, hydrate } from '@tanstack/react-query'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { preparationKeys } from '~queries/modules/preparation/keys.js'
import {
  myChamberQueryOptions,
  pathsQueryOptions,
  pathsInfiniteQueryOptions,
} from '~queries/modules/preparation/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000001')
const otherPathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

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
    version: 1,
    archived: false,
    generalChamberId: '50000000-0000-4000-8000-000000000001',
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

test('chamber queries isolate accounts and paths and preserve contact dates in the cache', () => {
  const response = {
    generalChamber: {
      id: '50000000-0000-4000-8000-000000000001',
      name: 'Polska Izba Inżynierów Budownictwa',
      shortName: 'PIIB',
      offices: [],
      websites: [
        {
          id: '55000000-0000-4000-8000-000000000001',
          url: 'https://www.piib.org.pl/',
          label: null,
          kind: 'website',
          sourceUrl: 'https://www.piib.org.pl/kontakt',
          checkedAt: '2026-11-26T11:00:00.000Z',
        },
      ],
    },
    districtChamber: null,
  }

  return withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/preparation/paths/:qualificationPathId/chamber',
        HttpServerResponse.jsonUnsafe(response),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const options = myChamberQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathId },
        })

        const otherAccount = myChamberQueryOptions(httpClient, otherUserId, {
          params: { qualificationPathId: pathId },
        })

        const otherPath = myChamberQueryOptions(httpClient, userId, {
          params: { qualificationPathId: otherPathId },
        })

        expect(await client.query(options)).toEqual(response)
        await client.query(otherAccount)
        await client.query(otherPath)
        await client.invalidateQueries({ queryKey: preparationKeys.path(userId, pathId) })
        expect(client.getQueryState(options.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherPath.queryKey)?.isInvalidated).toBe(false)
        const snapshot = JSON.parse(JSON.stringify(dehydrate(client)))
        await withQueryClient(async browser => {
          hydrate(browser, snapshot)
          expect(browser.getQueryData(options.queryKey)).toEqual(response)
        })
      }),
  )
})
