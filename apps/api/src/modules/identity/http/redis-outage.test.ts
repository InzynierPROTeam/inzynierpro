import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'

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

  expect(session.status).toBe(500)
  expect(await session.json()).toMatchObject({ type: 'internal_server_error' })

  expect((await api.visitor().sendCode(`other-${email}`)).error?.status).toBe(500)
  expect(api.sentEmails.length).toBe(delivered)

  expect((await visitor.signOut()).error?.status).toBe(500)

  await api.apiRedis.connect()

  expect((await visitor.session()).status).toBe(200)
})
