import { createServer } from 'node:http'

import { NodeHttpServer } from '@effect/platform-node'
import { getAuthClient } from '@inzpro/auth-client'
import { layer as EmailLayer } from '@inzpro/email/email-service'
import { Redis } from '@inzpro/redis'
import { type CookieJar, makeCookieJar } from '@inzpro/testing/cookie-jar'
import type { EmailAdapter, EmailMessage } from '@opencoredev/email-sdk'
import { memoryAdapter } from '@opencoredev/email-sdk/testing'
import { Context, Effect, Exit, identity, Layer, Logger, Predicate, Redacted, Scope } from 'effect'
import { HttpServer } from 'effect/http'
import { Pool } from 'pg'
import { createClient, type RedisClientType } from 'redis'
import { httpServerLayer } from '~api/http.js'
import { env } from '~api/lib/env.js'

export const platformOrigin = 'http://localhost:8001'

export const sessionCookie = 'inzynierpro.session_token'

// What a Better Auth client call resolves to: `error` is null on success.
type AuthResult = {
  readonly error: { readonly status: number; readonly code?: string | undefined } | null
}

export type TestVisitor = {
  readonly jar: CookieJar
  readonly sendCode: (email: string) => Promise<AuthResult>
  readonly signIn: (email: string, otp: string) => Promise<AuthResult>
  readonly signOut: () => Promise<AuthResult>
  readonly session: () => Promise<Response>
}

let nextAddress = 1

// Each visitor has its own client address, so rate-limit buckets do not leak between tests.
const uniqueAddress = () => {
  const value = nextAddress++

  return `10.${process.pid % 250}.${Math.floor(value / 250)}.${value % 250}`
}

// The API addresses sign-in emails to a single plain address.
const isSentTo = (message: EmailMessage, email: string) =>
  [message.to].flat().some(address => address === email)

export type TestApiOptions = {
  // Delivers email; defaults to an in-memory adapter whose messages the test can read.
  readonly emailAdapter?: EmailAdapter
}

export const startTestApi = async ({ emailAdapter }: TestApiOptions = {}) => {
  const config = await Effect.runPromise(Effect.map(env, identity))

  const scope = Scope.makeUnsafe()
  const outbox = memoryAdapter()
  const sentEmails = outbox.raw?.sent ?? []
  const logs: Array<string> = []

  const layer = httpServerLayer(config).pipe(
    Layer.provideMerge(NodeHttpServer.layer(createServer, { host: '127.0.0.1', port: 0 })),
    Layer.provide(EmailLayer(emailAdapter ?? outbox)),
    Layer.provide(Logger.layer([Logger.map(Logger.formatJson, line => logs.push(line))])),
  )

  const context = await Effect.runPromise(Layer.buildWithScope(layer, scope))
  const server = Context.get(context, HttpServer.HttpServer)

  if (Predicate.isTagged(server.address, 'UnixPathAddress')) {
    throw new Error('Expected a TCP server')
  }

  const baseUrl = `http://127.0.0.1:${server.address.port}`

  // Separate connections for arranging test state.
  const redis: RedisClientType = createClient({ url: Redacted.value(config.REDIS_URL) })
  const db = new Pool({ connectionString: Redacted.value(config.DATABASE_URL), max: 2 })

  await redis.connect()

  // A client of the API: the shared Better Auth client over a fetch that keeps cookies.
  const visitor = (): TestVisitor => {
    const jar = makeCookieJar({ origin: platformOrigin, 'x-forwarded-for': uniqueAddress() })
    const auth = getAuthClient({ baseURL: baseUrl, fetchOptions: { customFetchImpl: jar.fetch } })

    return {
      jar,
      sendCode: (email: string) => auth.emailOtp.sendVerificationOtp({ email, type: 'sign-in' }),
      signIn: (email: string, otp: string) => auth.signIn.emailOtp({ email, otp }),
      signOut: () => auth.signOut(),
      session: () => jar.fetch(new URL('/api/v1/identity/session', baseUrl)),
    }
  }

  // The six-digit code from the last email sent to the address.
  const lastCodeFor = (email: string) => {
    const sent = sentEmails.findLast(({ message }) => isSentTo(message, email))
    const code = sent?.message.text?.match(/\b(\d{6})\b/)?.[1]

    if (code === undefined) {
      throw new Error(`No sign-in code was sent to ${email}`)
    }

    return code
  }

  return {
    baseUrl,
    sentEmails,
    lastCodeFor,
    logs,
    visitor,
    // The Redis connection used by the running API, for simulating outages.
    apiRedis: Context.get(context, Redis),
    redis,
    db,
    close: async () => {
      await Promise.all([redis.close(), db.end()])
      await Effect.runPromise(Scope.close(scope, Exit.void))
    },
  }
}

export type TestApi = Awaited<ReturnType<typeof startTestApi>>
