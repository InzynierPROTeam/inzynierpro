import { config } from 'dotenv'
import { Config, type Effect } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

export const env = Config.all({
  NODE_ENV: Config.Literals(['development', 'test', 'production'], 'NODE_ENV'),
  PORT: Config.Port('PORT').pipe(Config.withDefault(4000)),
  PLATFORM_ORIGIN: Config.NonEmptyString('PLATFORM_ORIGIN'),
  DATABASE_URL: Config.Redacted('DATABASE_URL'),
  REDIS_URL: Config.Redacted('REDIS_URL'),
  BETTER_AUTH_URL: Config.URL('BETTER_AUTH_URL'),
  BETTER_AUTH_SECRET: Config.Redacted('BETTER_AUTH_SECRET'),
  COOKIES_DOMAIN: Config.option(Config.NonEmptyString('COOKIES_DOMAIN')),
  RESEND_API_KEY: Config.Redacted('RESEND_API_KEY'),
})

export type Env = Effect.Success<typeof env>
