import { Email } from '@inzpro/domain/common/email'
import { config } from 'dotenv'
import { Config, type Effect, Schema } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

const processVariables = {
  NODE_ENV: Config.Literals(['development', 'test', 'production'], 'NODE_ENV'),
  LOG_LEVEL: Config.LogLevel('LOG_LEVEL').pipe(Config.withDefault('Info')),
  DATABASE_URL: Config.Redacted('DATABASE_URL'),
}

export const processEnv = Config.all(processVariables)

export const fileStorageEnv = Config.all({
  endpoint: Config.URL('FILE_STORAGE_ENDPOINT'),
  region: Config.NonEmptyString('FILE_STORAGE_REGION').pipe(Config.withDefault('auto')),
  bucket: Config.NonEmptyString('FILE_STORAGE_BUCKET'),
  accessKeyId: Config.NonEmptyString('FILE_STORAGE_ACCESS_KEY_ID'),
  secretAccessKey: Config.Redacted('FILE_STORAGE_SECRET_ACCESS_KEY'),
})

export type ProcessEnv = Effect.Success<typeof processEnv>

export const env = Config.all({
  ...processVariables,
  PORT: Config.Port('PORT').pipe(Config.withDefault(4000)),
  RELEASE_SHA: Config.NonEmptyString('RELEASE_SHA').pipe(Config.withDefault('development')),
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
  // EXTERNAL: Trust this proxy address header only when the origin accepts traffic exclusively from that proxy.
  TRUSTED_CLIENT_IP_HEADER: Config.option(Config.NonEmptyString('TRUSTED_CLIENT_IP_HEADER')),
  RESEND_API_KEY: Config.Redacted('RESEND_API_KEY'),
  FILE_STORAGE: fileStorageEnv,
})

export type Env = Effect.Success<typeof env>

export const seedEnv = Config.all({
  SEED_DEMO_EMAIL: Config.option(
    Config.schema(Schema.Trim.pipe(Schema.decodeTo(Email)), 'SEED_DEMO_EMAIL'),
  ),
})
