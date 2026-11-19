import { defineRequestState } from '@better-auth/core/context'
import { appName } from '@inzpro/config/app'
import { PgPool } from '@inzpro/db/pool'
import { Email } from '@inzpro/domain/common/email'
import { Uuid } from '@inzpro/domain/common/id'
import { normalizeProfileName } from '@inzpro/domain/modules/profiles/profile'
import { EmailService } from '@inzpro/email/email-service'
import { getSender } from '@inzpro/email/lib/address'
import { SignInCode, signInCodeSubject } from '@inzpro/email/templates/sign-in-code'
import { Redis } from '@inzpro/redis'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { emailOTP } from 'better-auth/plugins'
import { Context, Duration, Effect, Exit, Layer, Match, Option, Redacted, Schema } from 'effect'
import { SecureRandom } from 'effect/crypto'
// EXTERNAL: Better Auth endpoint declarations reference zod internals; this import makes them nameable in emitted declarations.
import type {} from 'zod/v4/core'

import { generateUserName } from './user-name.js'

export const authBasePath = '/api/v1/auth'

export type AuthConfig = {
  readonly secret: Redacted.Redacted
  readonly baseUrl: URL
  readonly trustedOrigins: ReadonlyArray<string>
  readonly cookiesDomain: Option.Option<string>
  readonly trustedClientIpHeader: Option.Option<string>
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

// EXTERNAL: Better Auth reports send success after email delivery fails; the request state and after hook convert that failure into an error.
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
    databaseHooks: {
      user: {
        create: {
          before: async user => {
            const name = normalizeProfileName(user.name)

            if (name !== '') {
              return { data: { ...user, name } }
            }

            return {
              data: await runPromise(
                Effect.gen(function* () {
                  const secureRandom = yield* SecureRandom.SecureRandom
                  const nameSeed = yield* Schema.decodeEffect(Uuid)(yield* secureRandom.uuidV4())

                  return { ...user, name: yield* generateUserName(nameSeed) }
                }).pipe(Effect.provide(SecureRandom.layerWebCrypto)),
              ),
            }
          },
        },
      },
    },
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
      // EXTERNAL: Better Auth enables rate limiting only in production by default.
      enabled: true,
      storage: 'secondary-storage',
    },
    plugins: [
      emailOTP({
        expiresIn: Duration.toSeconds(signInCodeLifetime),
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
      // EXTERNAL: Better Auth disables origin validation in tests by default; enable it explicitly.
      disableOriginCheck: false,
      ipAddress: {
        ipAddressHeaders: Option.toArray(config.trustedClientIpHeader),
      },
      database: { generateId: false },
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
      additionalFields: {
        privateProfile: {
          type: 'boolean',
          fieldName: 'private_profile',
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
    session: {
      modelName: 'auth_sessions',
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
    disabledPaths: ['/update-user'],
    telemetry: { enabled: false },
    logger: {
      level: 'warn',
      // EXTERNAL: Better Auth logger arguments may contain sign-in codes; forward only the message.
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
