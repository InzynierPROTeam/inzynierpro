import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, uniqueAddress, type TestApi } from '~api/test/api-server.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const listSpecializations = (address: string) =>
  fetch(`${api.baseUrl}/api/v1/qualification-paths/specializations?limit=1`, {
    headers: { 'x-forwarded-for': address },
  })

test('a public read is limited per client address and says when to retry', async () => {
  const address = uniqueAddress()

  const first = await listSpecializations(address)

  expect(first.status).toBe(200)
  expect(first.headers.get('x-ratelimit-limit')).toBe('120')
  expect(first.headers.get('x-ratelimit-remaining')).toBe('119')

  // The bucket refills one token every 500 ms, so a slow run may need a few extra requests.
  let served = 1
  let limited = await listSpecializations(address)

  while (limited.status === 200 && served < 200) {
    served++
    limited = await listSpecializations(address)
  }

  expect(served).toBeGreaterThanOrEqual(120)
  expect(limited.status).toBe(429)
  expect(await limited.json()).toMatchObject({
    type: 'rate_limit_exceeded',
    message: 'Too many requests. Please try again later.',
  })
  expect(limited.headers.get('x-ratelimit-remaining')).toBe('0')
  expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)

  const span = api.spans.find(
    candidate =>
      candidate.traceId === limited.headers.get('x-request-id') &&
      candidate.name === 'RateLimit.consume',
  )

  expect(span?.attributes.get('app.rate_limit.exceeded')).toBe(true)
  expect(span?.attributes.get('app.rate_limit.policy')).toBe('public-read')

  // Another client keeps its own bucket.
  expect((await listSpecializations(uniqueAddress())).status).toBe(200)
})

test('a public read is served while the rate-limit store is down', async () => {
  api.apiRedis.destroy()

  try {
    const response = await listSpecializations(uniqueAddress())

    expect(response.status).toBe(200)
    expect(response.headers.get('x-ratelimit-limit')).toBeNull()
    expect(api.logs.join('\n')).toContain('Rate limiter unavailable; request allowed')
  } finally {
    await api.apiRedis.connect()
  }
})
