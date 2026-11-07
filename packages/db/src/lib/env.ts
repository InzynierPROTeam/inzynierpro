import { config } from 'dotenv'
import { Config, Schema } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

export const env = Config.all({
  DATABASE_URL: Config.schema(Schema.RedactedFromValue(Schema.NonEmptyString), 'DATABASE_URL'),
})
