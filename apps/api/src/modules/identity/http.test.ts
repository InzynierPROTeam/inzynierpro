import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { failingAdapter } from '@opencoredev/email-sdk/testing'
import { Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { sessionCookie, startTestApi, type TestApi } from '~api/test/api-server.js'

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
  test('a new verified address gets an account and a session', async () => {
    const visitor = api.visitor()
    const email = uniqueEmail('new')

    expect((await visitor.sendCode(email)).error).toBeNull()
    expect((await visitor.signIn(email, lastCodeFor(email))).error).toBeNull()

    const session = await visitor.session()

    expect(session.status).toBe(200)
    expect(await session.json()).toMatchObject({ user: { email, name: '' } })
  })

  test('an existing address signs in to the same account without a duplicate', async () => {
    const email = uniqueEmail('existing')
    const first = api.visitor()

    await first.sendCode(email)
    await first.signIn(email, lastCodeFor(email))

    const firstUser = await (await first.session()).json()
    const second = api.visitor()

    await second.sendCode(email.toUpperCase())

    expect((await second.signIn(email.toUpperCase(), lastCodeFor(email))).error).toBeNull()
    expect(await (await second.session()).json()).toEqual(firstUser)

    const users = await api.db.query('SELECT count(*)::int AS count FROM users WHERE email = $1', [
      email,
    ])

    expect(users.rows).toEqual([{ count: 1 }])
  })

  test('a wrong code does not create a session', async () => {
    const visitor = api.visitor()
    const email = uniqueEmail('wrong')

    await visitor.sendCode(email)

    const { error } = await visitor.signIn(email, otherCode(lastCodeFor(email)))

    expect(error).toMatchObject({ status: 400, code: 'INVALID_OTP' })
    expect(visitor.jar.cookies.size).toBe(0)
    expect((await visitor.session()).status).toBe(401)
  })

  test('a code is invalidated after too many wrong attempts, even from other addresses', async () => {
    const email = uniqueEmail('attempts')

    await api.visitor().sendCode(email)

    const code = lastCodeFor(email)

    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await api.visitor().signIn(email, otherCode(code))).error?.status).toBe(400)
    }

    expect((await api.visitor().signIn(email, code)).error).toMatchObject({
      status: 403,
      code: 'TOO_MANY_ATTEMPTS',
    })
  })

  test('an expired code is rejected', async () => {
    const visitor = api.visitor()
    const email = uniqueEmail('expired')

    await visitor.sendCode(email)

    const code = lastCodeFor(email)

    // Simulate the passage of time: the stored code expires and its cache entry lapses.
    await api.db.query(
      `UPDATE auth_verifications SET expires_at = now() - interval '1 second' WHERE identifier = $1`,
      [`sign-in-otp-${email}`],
    )
    expect(await api.redis.del(`verification:sign-in-otp-${email}`)).toBe(1)

    expect((await visitor.signIn(email, code)).error).toMatchObject({
      status: 400,
      code: 'OTP_EXPIRED',
    })
    expect((await visitor.session()).status).toBe(401)
  })

  test('a code can be used only once', async () => {
    const email = uniqueEmail('once')
    const visitor = api.visitor()

    await visitor.sendCode(email)

    const code = lastCodeFor(email)

    expect((await visitor.signIn(email, code)).error).toBeNull()
    expect((await api.visitor().signIn(email, code)).error?.status).toBe(400)
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

  test('a forged session cookie is refused', async () => {
    const visitor = api.visitor()

    visitor.jar.cookies.set(sessionCookie, 'forged.token')

    expect((await visitor.session()).status).toBe(401)
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

  test('an expired session is refused', async () => {
    const { visitor, token } = await signedInVisitor('expired-session')

    await api.db.query(
      `UPDATE auth_sessions SET expires_at = now() - interval '1 second' WHERE token = $1`,
      [token],
    )
    expect(await api.redis.del(token)).toBe(1)

    expect((await visitor.session()).status).toBe(401)
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

describe('abuse protection', () => {
  test('sending codes is rate limited per client address', async () => {
    const visitor = api.visitor()
    const sent = api.sentEmails.length

    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await visitor.sendCode(uniqueEmail('limited'))).error).toBeNull()
    }

    expect((await visitor.sendCode(uniqueEmail('limited'))).error?.status).toBe(429)
    expect(api.sentEmails.length - sent).toBe(3)
  })
})

describe('previously unverified account', () => {
  test('proving the address removes access that was never proven', async () => {
    const email = uniqueEmail('unverified')

    const { rows } = await api.db.query<{ id: string }>(
      `INSERT INTO users (name, email, email_verified) VALUES ('Intruz', $1, false) RETURNING id`,
      [email],
    )

    const userId = rows[0]?.id

    await api.db.query(
      `INSERT INTO auth_accounts (user_id, account_id, provider_id) VALUES ($1, 'intruder', 'github')`,
      [userId],
    )
    await api.db.query(
      `INSERT INTO auth_sessions (user_id, token, expires_at)
       VALUES ($1, $2, now() + interval '1 day')`,
      [userId, `intruder-${crypto.randomUUID()}`],
    )

    const owner = api.visitor()

    await owner.sendCode(email)

    expect((await owner.signIn(email, lastCodeFor(email))).error).toBeNull()
    expect(await (await owner.session()).json()).toMatchObject({ user: { id: userId, email } })

    const state = await api.db.query(
      `SELECT u.email_verified,
              (SELECT count(*)::int FROM auth_accounts a WHERE a.user_id = u.id) AS accounts,
              (SELECT count(*)::int FROM auth_sessions s WHERE s.user_id = u.id) AS sessions
       FROM users u WHERE u.id = $1`,
      [userId],
    )

    expect(state.rows).toEqual([{ email_verified: true, accounts: 0, sessions: 1 }])
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

    expect((await retry.signIn(email, otherCode(nextCode))).error?.status).toBe(400)

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
