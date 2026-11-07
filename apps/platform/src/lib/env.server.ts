import { config } from 'dotenv'
import { Effect, Schema } from 'effect'

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

const Port = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
  Schema.withDecodingDefault(Effect.succeed('8001')),
)

export const env = Schema.decodeUnknownSync(
  Schema.Struct({
    NODE_ENV: Schema.Literals(['development', 'test', 'production']),
    PORT: Port,
  }),
)(process.env)
