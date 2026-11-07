import { config } from 'dotenv'
import { Config, Effect, Schema } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

export const env = Config.all({
  NODE_ENV: Config.Literals(['development', 'test', 'production'], 'NODE_ENV'),
  PORT: Config.Port('PORT').pipe(Config.withDefault(4000)),
  PLATFORM_ORIGIN: Config.NonEmptyString('PLATFORM_ORIGIN'),
  DATABASE_URL: Config.schema(Schema.RedactedFromValue(Schema.NonEmptyString), 'DATABASE_URL'),
})

export type Env = Effect.Success<typeof env>
