import { defineRequestState } from '@better-auth/core/context'
import { appName } from '@inzpro/config/app'
import { PgPool } from '@inzpro/db/pool'
import { Email } from '@inzpro/domain/common/email'
import { EmailService } from '@inzpro/email/email-service'
import { getSender } from '@inzpro/email/lib/address'
import { SignInCode, signInCodeSubject } from '@inzpro/email/templates/sign-in-code'
import { Redis } from '@inzpro/redis'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { emailOTP } from 'better-auth/plugins'
import { Context, Duration, Effect, Exit, Layer, Match, Option, Redacted, Schema } from 'effect'
// Better Auth's endpoint types refer to zod internals. This import lets TypeScript name them
// in the emitted declarations, so `Auth` keeps the full, plugin-aware Better Auth type.
import type {} from 'zod/v4/core'

export const authBasePath = '/api/v1/auth'

export type AuthConfig = {
  readonly secret: Redacted.Redacted
  readonly baseUrl: URL
  readonly trustedOrigins: ReadonlyArray<string>
  readonly cookiesDomain: Option.Option<string>
  readonly google: Option.Option<{
    readonly clientId: string
    readonly clientSecret: Redacted.Redacted
  }>
}

type PgPoolClient = (typeof PgPool)['Service']

type RedisClient = (typeof Redis)['Service']

type EmailServiceClient = (typeof EmailService)['Service']

const signInCodeLifetime = Duration.minutes(5)

const incrementWithTtl = `
  local value = redis.call('INCR', KEYS[1])
  if value == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return value
`

const decodeEmail = Schema.decodeUnknownSync(Email)

const sendSignInCodePath = '/email-otp/send-verification-otp'

// Better Auth logs a failed send and still answers that the code was sent. The send callback
// records the failure for the current request, and an after hook turns it into an error.
const signInCodeNotSent = defineRequestState(() => false)

export const signInCodeNotSentError = {
  code: 'SIGN_IN_CODE_NOT_SENT',
  message: 'The sign-in code could not be sent.',
}

const makeAuth = (
  config: AuthConfig,
  pool: PgPoolClient,
  redis: RedisClient,
  emails: EmailServiceClient,
  runPromise: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>,
  runPromiseExit: <A, E>(effect: Effect.Effect<A, E>) => Promise<Exit.Exit<A, E>>,
) =>
  betterAuth({
    appName,
    secret: Redacted.value(config.secret),
    baseURL: config.baseUrl.origin,
    basePath: authBasePath,
    trustedOrigins: [...config.trustedOrigins],
    socialProviders: Option.match(config.google, {
      onNone: () => ({}),
      onSome: google => ({
        google: {
          prompt: 'select_account',
          clientId: google.clientId,
          clientSecret: Redacted.value(google.clientSecret),
        },
      }),
    }),
    database: pool,
    secondaryStorage: {
      get: key => redis.get(key),
      set: async (key, value, ttl) => {
        await (ttl === undefined
          ? redis.set(key, value)
          : redis.set(key, value, { expiration: { type: 'EX', value: ttl } }))
      },
      delete: async key => {
        await redis.del(key)
      },
      getAndDelete: key => redis.getDel(key),
      increment: async (key, ttl) =>
        Number(await redis.eval(incrementWithTtl, { keys: [key], arguments: [String(ttl)] })),
    },
    rateLimit: {
      // The library enables rate limiting only when NODE_ENV is production.
      enabled: true,
      storage: 'secondary-storage',
    },
    plugins: [
      emailOTP({
        expiresIn: Duration.toSeconds(signInCodeLifetime),
        // Storage keeps only a hash, never a usable code.
        storeOTP: 'hashed',
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== 'sign-in') {
            return
          }

          const sent = await runPromiseExit(
            emails
              .send({
                from: getSender('info'),
                to: [decodeEmail(email)],
                subject: signInCodeSubject,
                template: SignInCode({
                  code: otp,
                  expiresInMinutes: Duration.toMinutes(signInCodeLifetime),
                }),
              })
              .pipe(
                Effect.tapError(error => Effect.logError('[Auth]: Sign-in code not sent.', error)),
              ),
          )

          if (Exit.isFailure(sent)) {
            await signInCodeNotSent.set(true)
          }
        },
      }),
    ],
    advanced: {
      // Keep callback/origin validation enabled in tests too (Better Auth skips it by default).
      disableOriginCheck: false,
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
      },
      // PostgreSQL generates uuidv7 ids. Ids Better Auth must generate itself are UUIDs too.
      database: { generateId: 'uuid' },
      cookiePrefix: 'inzynierpro',
      crossSubDomainCookies: Option.match(config.cookiesDomain, {
        onNone: () => undefined,
        onSome: domain => ({ enabled: true, domain }),
      }),
    },
    user: {
      modelName: 'users',
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    session: {
      modelName: 'auth_sessions',
      // PostgreSQL keeps sessions durable; Redis caches them.
      storeSessionInDatabase: true,
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    account: {
      modelName: 'auth_accounts',
      accountLinking: {
        enabled: true,
        trustedProviders: [],
        requireLocalEmailVerified: true,
        allowDifferentEmails: false,
      },
      fields: {
        userId: 'user_id',
        accountId: 'account_id',
        providerId: 'provider_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    verification: {
      modelName: 'auth_verifications',
      storeInDatabase: true,
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    hooks: {
      after: createAuthMiddleware(async ctx => {
        if (ctx.path === sendSignInCodePath && (await signInCodeNotSent.get())) {
          throw APIError.from('SERVICE_UNAVAILABLE', signInCodeNotSentError)
        }
      }),
    },
    telemetry: { enabled: false },
    logger: {
      level: 'warn',
      // Only the message is logged; the arguments may carry request data such as codes.
      log: (level, message) => {
        const log = Match.value(level).pipe(
          Match.when('error', () => Effect.logError),
          Match.when('warn', () => Effect.logWarning),
          Match.when('info', () => Effect.logInfo),
          Match.orElse(() => Effect.logDebug),
        )

        void runPromise(log('[Auth]:', message))
      },
    },
  })

export type BetterAuth = ReturnType<typeof makeAuth>

export class Auth extends Context.Service<Auth, BetterAuth>()('Auth') {}

export const layer = (config: AuthConfig) =>
  Layer.effect(
    Auth,
    Effect.gen(function* () {
      const pgPool = yield* PgPool
      const redis = yield* Redis
      const emailService = yield* EmailService
      const context = yield* Effect.context()

      return makeAuth(
        config,
        pgPool,
        redis,
        emailService,
        Effect.runPromiseWith(context),
        Effect.runPromiseExitWith(context),
      )
    }),
  )
