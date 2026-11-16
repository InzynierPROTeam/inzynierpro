import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { CurrentSessionResponse } from '@inzpro/api-contracts/modules/identity/responses'
import { failingAdapter } from '@opencoredev/email-sdk/testing'
import { Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { sessionCookie, startTestApi, type TestApi, uniqueAddress } from '~api/test/api-server.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const uniqueEmail = (label: string) => `${label}-${crypto.randomUUID()}@example.com`

const lastCodeFor = (email: string) => api.lastCodeFor(email)

const otherCode = (code: string) => (code === '000000' ? '111111' : '000000')

const signedInVisitor = async (label: string) => {
  const visitor = api.visitor()
  const email = uniqueEmail(label)

  await visitor.sendCode(email)
  await visitor.signIn(email, lastCodeFor(email))

  const cookie = visitor.jar.cookies.get(sessionCookie)

  if (cookie === undefined) {
    throw new Error('Sign-in did not set a session cookie')
  }

  // The cookie value is `<token>.<signature>`; Redis caches the session under the token.
  const token = decodeURIComponent(cookie).split('.')[0] ?? ''

  return { visitor, email, cookie, token }
}

describe('signing in with an email code', () => {
  test('email sign-in exposes the signed-in user through our protected API', async () => {
    const visitor = api.visitor()
    const email = uniqueEmail('new')

    expect((await visitor.sendCode(email)).error).toBeNull()
    expect((await visitor.signIn(email, lastCodeFor(email))).error).toBeNull()

    const session = await visitor.session()

    expect(session.status).toBe(200)

    const body = await session.json()

    expect(body).toMatchObject({
      user: { email, name: expect.stringMatching(/^Inżynier#[0-9A-F]{6}$/) },
    })

    const traceId = session.headers.get('x-request-id')
    const serverSpan = api.spans.find(span => span.traceId === traceId && span.kind === 'server')
    const attributes = JSON.stringify([...(serverSpan?.attributes ?? [])])

    expect(body).toMatchObject({ user: { id: serverSpan?.attributes.get('user.id') } })
    expect(attributes).not.toContain(email)
  })
})

describe('default account names', () => {
  test.each(['', '   '])('a blank name gets a persistent generated name (%j)', async name => {
    const visitor = api.visitor()
    const email = uniqueEmail('default-name')
    await visitor.sendCode(email)
    expect((await visitor.signIn(email, lastCodeFor(email), name)).error).toBeNull()

    const first = Schema.decodeUnknownSync(CurrentSessionResponse)(
      await (await visitor.session()).json(),
    )

    expect(first.user.name).toMatch(/^Inżynier#[0-9A-F]{6}$/)
    expect(Schema.is(Schema.String.check(Schema.isUUID(7)))(first.user.id)).toBe(true)
    expect(first.user.image).toBeNull()

    await visitor.signOut()
    await visitor.sendCode(email)
    expect((await visitor.signIn(email, lastCodeFor(email), 'Replacement name')).error).toBeNull()
    expect(await (await visitor.session()).json()).toMatchObject({
      user: { id: first.user.id, name: first.user.name },
    })
  })

  test('a supplied name is kept during account creation and subsequent sign-in', async () => {
    const visitor = api.visitor()
    const email = uniqueEmail('provided-name')
    await visitor.sendCode(email)
    expect((await visitor.signIn(email, lastCodeFor(email), 'Anna Kowalska')).error).toBeNull()
    expect(await (await visitor.session()).json()).toMatchObject({
      user: { name: 'Anna Kowalska' },
    })

    await visitor.signOut()
    await visitor.sendCode(email)
    expect((await visitor.signIn(email, lastCodeFor(email))).error).toBeNull()
    expect(await (await visitor.session()).json()).toMatchObject({
      user: { name: 'Anna Kowalska' },
    })
  })
})

describe('protected API access', () => {
  test('a request without a session is refused with a typed error', async () => {
    const response = await api.visitor().session()

    expect(response.status).toBe(401)
    expect(Schema.decodeUnknownSync(Unauthenticated)(await response.json())).toBeInstanceOf(
      Unauthenticated,
    )
  })
})

describe('durable session', () => {
  test('survives losing its Redis cache entry and an API restart', async () => {
    const { visitor, cookie, token } = await signedInVisitor('durable')

    expect(await api.redis.del(token)).toBe(1)
    expect((await visitor.session()).status).toBe(200)

    const restarted = await startTestApi()

    try {
      const reloaded = restarted.visitor()

      reloaded.jar.cookies.set(sessionCookie, cookie)

      expect((await reloaded.session()).status).toBe(200)
    } finally {
      await restarted.close()
    }
  })
})

describe('signing out', () => {
  test('revokes the session, so a copied cookie stops working', async () => {
    const { visitor, cookie, token } = await signedInVisitor('logout')

    expect((await visitor.signOut()).error).toBeNull()
    expect(visitor.jar.cookies.has(sessionCookie)).toBe(false)
    expect((await visitor.session()).status).toBe(401)

    const replay = api.visitor()

    replay.jar.cookies.set(sessionCookie, cookie)

    expect((await replay.session()).status).toBe(401)

    await api.redis.del(token)

    expect((await replay.session()).status).toBe(401)
  })
})

describe('Redis rate-limit storage', () => {
  test('sending codes is rate limited per client address', async () => {
    const visitor = api.visitor()
    const sent = api.sentEmails.length

    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await visitor.sendCode(uniqueEmail('limited'))).error).toBeNull()
    }

    expect((await visitor.sendCode(uniqueEmail('limited'))).error?.status).toBe(429)
    expect(api.sentEmails.length - sent).toBe(3)
  })

  test('only the trusted client address header separates clients', async () => {
    const address = uniqueAddress()

    // Headers the proxy does not set are ignored, so forging them does not open a new bucket.
    const forged = (forgedAddress: string) =>
      api.visitor({ 'x-forwarded-for': address, 'cf-connecting-ip': forgedAddress })

    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await forged(uniqueAddress()).sendCode(uniqueEmail('forged'))).error).toBeNull()
    }

    expect((await forged(uniqueAddress()).sendCode(uniqueEmail('forged'))).error?.status).toBe(429)
    expect((await api.visitor().sendCode(uniqueEmail('other-client'))).error).toBeNull()
  })
})

describe('mail delivery', () => {
  test('a code that could not be sent is reported, and the log holds no code', async () => {
    const failing = await startTestApi({ emailAdapter: failingAdapter() })

    try {
      const { error } = await failing.visitor().sendCode(uniqueEmail('undelivered'))

      expect(error).toMatchObject({ status: 503, code: 'SIGN_IN_CODE_NOT_SENT' })
      expect(failing.logs.join('\n')).toContain('Sign-in code not sent')
      expect(failing.logs.join('\n')).not.toMatch(/\b\d{6}\b/)
    } finally {
      await failing.close()
    }
  })
})

describe('telemetry', () => {
  test('logs contain neither sign-in codes nor session tokens', async () => {
    const { email, token } = await signedInVisitor('logs')
    const code = lastCodeFor(email)
    const retry = api.visitor()

    await retry.sendCode(email)

    const nextCode = lastCodeFor(email)

    await retry.signIn(email, otherCode(nextCode))

    const logs = api.logs.join('\n')

    expect(logs).not.toBe('')

    for (const secret of [code, nextCode, otherCode(nextCode), token]) {
      expect(logs).not.toContain(secret)
    }
  })
})

describe('database schema', () => {
  test('the identity migration matches the schema Better Auth validates at startup', async () => {
    await signedInVisitor('schema')

    const schemaReports = api.logs.filter(
      line => line.includes('[Auth]:') && line.toLowerCase().includes('schema'),
    )

    expect(schemaReports).toEqual([])
  })
})

describe('cross-origin session reads from the platform', () => {
  test('the preflight allows the trace headers the Effect HTTP client sends', async () => {
    const response = await fetch(new URL('/api/v1/identity/session', api.baseUrl), {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:8001',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'b3,traceparent',
      },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8001')
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    expect(response.headers.get('access-control-allow-headers')?.split(',')).toEqual(
      expect.arrayContaining(['traceparent', 'b3']),
    )
  })
})
