import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'

let api: TestApi
let baseUrl: string

beforeAll(async () => {
  api = await startTestApi()
  baseUrl = api.baseUrl
})

afterAll(() => api.close())

test('health-check uses /api/v1 and returns only status', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health-check`, {
    headers: { origin: 'http://localhost:8001' },
  })

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok' })
  expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/)
  expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8001')
})

test('an unknown API version returns an error response', async () => {
  const response = await fetch(`${baseUrl}/api/v2/health-check`)
  const body = await response.json()

  expect(response.status).toBe(404)
  expect(body).toMatchObject({
    type: 'route_not_found',
    message: 'The requested API route was not found.',
  })
  expect(body).not.toHaveProperty('requestId')
  expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/)
})
