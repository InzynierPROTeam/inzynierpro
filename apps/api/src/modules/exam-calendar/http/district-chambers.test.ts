import { DistrictChambersResponse } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'

const engineersChamber = '50000000-0000-4000-8000-000000000001'
const architectsChamber = '50000000-0000-4000-8000-000000000002'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const listDistrictChambers = async (query: string) => {
  const response = await api
    .visitor()
    .jar.fetch(new URL(`/api/v1/exam-calendar/district-chambers?${query}`, api.baseUrl))

  return { status: response.status, body: await response.json() }
}

const decodePage = Schema.decodeUnknownSync(Schema.toCodecJson(DistrictChambersResponse))

test('the public catalogue lists the district chambers of one general chamber in order', async () => {
  const { status, body } = await listDistrictChambers(`generalChamberId=${engineersChamber}`)

  expect(status).toBe(200)

  const page = decodePage(body)

  expect(page.data).toHaveLength(16)
  expect(page.data.every(chamber => chamber.code.startsWith('piib-'))).toBe(true)
  expect(page.data.slice(0, 2)).toEqual([
    {
      id: '51000000-0000-4000-8000-000000000001',
      code: 'piib-dolnoslaska',
      name: 'Dolnośląska Okręgowa Izba Inżynierów Budownictwa',
      shortName: 'Dolnośląska',
    },
    expect.objectContaining({ code: 'piib-kujawsko-pomorska' }),
  ])
})

test('cursor pages continue the district chamber order without repeats', async () => {
  const all = decodePage(
    (await listDistrictChambers(`generalChamberId=${architectsChamber}`)).body,
  ).data.map(chamber => chamber.id)

  const first = decodePage(
    (await listDistrictChambers(`generalChamberId=${architectsChamber}&limit=10`)).body,
  )

  expect(first.meta.hasMore).toBe(true)

  const second = decodePage(
    (
      await listDistrictChambers(
        `generalChamberId=${architectsChamber}&limit=10&cursor=${encodeURIComponent(first.meta.nextCursor ?? '')}`,
      )
    ).body,
  )

  expect(second.meta.hasMore).toBe(false)
  expect([...first.data, ...second.data].map(chamber => chamber.id)).toEqual(all)
})

test('the district chamber catalogue rejects a missing general chamber and a bad cursor', async () => {
  expect((await listDistrictChambers('')).status).toBe(400)
  expect(
    (await listDistrictChambers(`generalChamberId=${engineersChamber}&cursor=bad`)).status,
  ).toBe(400)
})
