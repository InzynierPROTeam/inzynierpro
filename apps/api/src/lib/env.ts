import { config } from 'dotenv'
import { Config, type Effect, Schema } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

export const env = Config.all({
  NODE_ENV: Config.Literals(['development', 'test', 'production'], 'NODE_ENV'),
  PORT: Config.Port('PORT').pipe(Config.withDefault(4000)),
  LOG_LEVEL: Config.LogLevel('LOG_LEVEL').pipe(Config.withDefault('Info')),
  // Comma-separated client origins allowed by CORS and Better Auth, e.g. `http://localhost:8001`.
  TRUSTED_ORIGINS: Config.Array(
    Schema.Trim.pipe(Schema.decodeTo(Schema.NonEmptyString)),
    'TRUSTED_ORIGINS',
  ),
  DATABASE_URL: Config.Redacted('DATABASE_URL'),
  REDIS_URL: Config.Redacted('REDIS_URL'),
  BETTER_AUTH_URL: Config.URL('BETTER_AUTH_URL'),
  BETTER_AUTH_SECRET: Config.Redacted('BETTER_AUTH_SECRET'),
  GOOGLE: Config.all({
    clientId: Config.NonEmptyString('GOOGLE_CLIENT_ID'),
    clientSecret: Config.Redacted('GOOGLE_CLIENT_SECRET'),
  }).pipe(Config.option),
  COOKIES_DOMAIN: Config.option(Config.NonEmptyString('COOKIES_DOMAIN')),
  RESEND_API_KEY: Config.Redacted('RESEND_API_KEY'),
})

export type Env = Effect.Success<typeof env>
