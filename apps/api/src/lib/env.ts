import { config } from 'dotenv'
import { Config, type Effect, Schema } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

const processVariables = {
  NODE_ENV: Config.Literals(['development', 'test', 'production'], 'NODE_ENV'),
  LOG_LEVEL: Config.LogLevel('LOG_LEVEL').pipe(Config.withDefault('Info')),
  DATABASE_URL: Config.Redacted('DATABASE_URL'),
}

export const processEnv = Config.all(processVariables)

export type ProcessEnv = Effect.Success<typeof processEnv>

export const env = Config.all({
  ...processVariables,
  PORT: Config.Port('PORT').pipe(Config.withDefault(4000)),
  RELEASE_SHA: Config.NonEmptyString('RELEASE_SHA').pipe(Config.withDefault('development')),
  // Comma-separated client origins allowed by CORS and Better Auth, e.g. `http://localhost:8001`.
  TRUSTED_ORIGINS: Config.Array(
    Schema.Trim.pipe(Schema.decodeTo(Schema.NonEmptyString)),
    'TRUSTED_ORIGINS',
  ),
  REDIS_URL: Config.Redacted('REDIS_URL'),
  BETTER_AUTH_URL: Config.URL('BETTER_AUTH_URL'),
  BETTER_AUTH_SECRET: Config.Redacted('BETTER_AUTH_SECRET'),
  GOOGLE: Config.all({
    clientId: Config.NonEmptyString('GOOGLE_CLIENT_ID'),
    clientSecret: Config.Redacted('GOOGLE_CLIENT_SECRET'),
  }).pipe(Config.option),
  COOKIES_DOMAIN: Config.option(Config.NonEmptyString('COOKIES_DOMAIN')),
  // Header with the client address set by the proxy, e.g. `cf-connecting-ip`. Only safe when the
  // origin accepts traffic from that proxy alone; without it the socket peer is the client.
  TRUSTED_CLIENT_IP_HEADER: Config.option(Config.NonEmptyString('TRUSTED_CLIENT_IP_HEADER')),
  RESEND_API_KEY: Config.Redacted('RESEND_API_KEY'),
})

export type Env = Effect.Success<typeof env>
