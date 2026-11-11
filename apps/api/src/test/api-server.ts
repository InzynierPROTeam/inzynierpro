import { createServer } from 'node:http'

import { NodeHttpServer } from '@effect/platform-node'
import { getAuthClient } from '@inzpro/auth-client'
import { layer as EmailLayer } from '@inzpro/email/email-service'
import { Redis } from '@inzpro/redis'
import { type CookieJar, makeCookieJar } from '@inzpro/testing/cookie-jar'
import type { EmailAdapter, EmailMessage } from '@opencoredev/email-sdk'
import { memoryAdapter } from '@opencoredev/email-sdk/testing'
import {
  Context,
  Effect,
  Exit,
  identity,
  Layer,
  Logger,
  Option,
  Predicate,
  Random,
  Redacted,
  Scope,
  Tracer,
} from 'effect'
import { HttpServer } from 'effect/http'
import { createClient, type RedisClientType } from 'redis'
import { httpServerLayer } from '~api/http.js'
import { env } from '~api/lib/env.js'
import { redactingTracer } from '~api/lib/observability.js'

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

// Each visitor has its own random client address, so rate-limit buckets do not leak between tests
// or test files running in parallel.
const octet = Random.nextIntBetween(0, 255)

export const uniqueAddress = () =>
  Effect.runSync(
    Effect.all([octet, octet, octet]).pipe(Effect.map(parts => `10.${parts.join('.')}`)),
  )

// The API addresses sign-in emails to a single plain address.
const isSentTo = (message: EmailMessage, email: string) =>
  [message.to].flat().some(address => address === email)

export type TestApiOptions = {
  // Delivers email; defaults to an in-memory adapter whose messages the test can read.
  readonly emailAdapter?: EmailAdapter
  readonly google?: { readonly clientId: string; readonly clientSecret: string }
}

export const startTestApi = async ({ emailAdapter, google }: TestApiOptions = {}) => {
  const loaded = await Effect.runPromise(Effect.map(env, identity))

  const config = {
    ...loaded,
    // Mirrors production behind a proxy; visitors send unique addresses so buckets never collide.
    TRUSTED_CLIENT_IP_HEADER: Option.some('x-forwarded-for'),
    GOOGLE:
      google === undefined
        ? loaded.GOOGLE
        : Option.some({
            clientId: google.clientId,
            clientSecret: Redacted.make(google.clientSecret),
          }),
  }

  const scope = Scope.makeUnsafe()
  const outbox = memoryAdapter()
  const sentEmails = outbox.raw?.sent ?? []
  const logs: Array<string> = []
  const spans: Array<Tracer.Span> = []

  // Records spans in memory the way the OTLP tracer would export them, sensitive attributes removed.
  const tracer = redactingTracer(
    Tracer.make({
      span: options => {
        const span = new Tracer.NativeSpan(options)

        spans.push(span)

        return span
      },
    }),
  )

  const layer = httpServerLayer(config).pipe(
    Layer.provideMerge(NodeHttpServer.layer(createServer, { host: '127.0.0.1', port: 0 })),
    Layer.provide(EmailLayer(emailAdapter ?? outbox)),
    Layer.provide(Logger.layer([Logger.map(Logger.formatJson, line => logs.push(line))])),
    Layer.provide(Layer.succeed(Tracer.Tracer, tracer)),
  )

  const context = await Effect.runPromise(Layer.buildWithScope(layer, scope))
  const server = Context.get(context, HttpServer.HttpServer)

  if (Predicate.isTagged(server.address, 'UnixPathAddress')) {
    throw new Error('Expected a TCP server')
  }

  const baseUrl = `http://127.0.0.1:${server.address.port}`

  // Separate connection for evicting session cache entries in integration tests.
  const redis: RedisClientType = createClient({ url: Redacted.value(config.REDIS_URL) })

  await redis.connect()

  // A client of the API: the shared Better Auth client over a fetch that keeps cookies.
  // Extra headers are sent with every request, e.g. a forged client address.
  const visitor = (headers: Record<string, string> = {}): TestVisitor => {
    const jar = makeCookieJar({
      origin: platformOrigin,
      'x-forwarded-for': uniqueAddress(),
      ...headers,
    })

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
    spans,
    visitor,
    // The Redis connection used by the running API, for simulating outages.
    apiRedis: Context.get(context, Redis),
    redis,
    close: async () => {
      await redis.close()
      await Effect.runPromise(Scope.close(scope, Exit.void))
    },
  }
}

export type TestApi = Awaited<ReturnType<typeof startTestApi>>
