import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi({ google: { clientId: 'test-google', clientSecret: 'test-only' } })
})

afterAll(() => api.close())

test('Google offers the account chooser and the API callback', async () => {
  const response = await api
    .visitor()
    .jar.fetch(new URL('/api/v1/auth/sign-in/social', api.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: 'http://localhost:8001/start',
        disableRedirect: true,
      }),
    })

  expect(response.status).toBe(200)

  const { url } = Schema.decodeUnknownSync(Schema.Struct({ url: Schema.String }))(
    await response.json(),
  )

  const authorization = new URL(url)

  expect(authorization.origin).toBe('https://accounts.google.com')
  expect(authorization.searchParams.get('prompt')).toBe('select_account')
  expect(authorization.searchParams.get('redirect_uri')).toBe(
    'http://localhost:4000/api/v1/auth/callback/google',
  )
  expect(authorization.searchParams.get('client_id')).toBe('test-google')
})

test('an untrusted callback URL is refused before leaving for Google', async () => {
  const visitor = api.visitor()

  const response = await visitor.jar.fetch(new URL('/api/v1/auth/sign-in/social', api.baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: 'google', callbackURL: 'https://evil.example/start' }),
  })

  expect(response.status).toBe(403)
  expect((await visitor.session()).status).toBe(401)
})
