import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'

// Redis caches sessions and stores rate limits. This pins the behavior while it is unavailable:
// requests fail closed with a server error. Nothing skips rate limiting or reports a signed-in
// user as signed out.

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('a Redis outage fails closed and the session works again after recovery', async () => {
  const visitor = api.visitor()
  const email = `outage-${crypto.randomUUID()}@example.com`

  await visitor.sendCode(email)

  const code = api.lastCodeFor(email)

  expect((await visitor.signIn(email, code)).error).toBeNull()

  const delivered = api.sentEmails.length

  api.apiRedis.destroy()

  const session = await visitor.session()

  // A server error, not 401: the client must not treat an outage as a sign-out.
  expect(session.status).toBe(500)
  expect(await session.json()).toMatchObject({ type: 'internal_server_error' })

  // Without rate-limit storage no code is sent.
  expect((await api.visitor().sendCode(`other-${email}`)).error?.status).toBe(500)
  expect(api.sentEmails.length).toBe(delivered)

  // Sign-out cannot confirm revocation, so it reports a failure instead of success.
  expect((await visitor.signOut()).error?.status).toBe(500)

  await api.apiRedis.connect()

  expect((await visitor.session()).status).toBe(200)
})
