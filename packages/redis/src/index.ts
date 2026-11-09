import { Context, Data, Effect, Layer, Redacted } from 'effect'
import { createClient, type RedisClientType } from 'redis'

export class RedisError extends Data.TaggedError('RedisError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Redis operation failed.'
  }
}

export class Redis extends Context.Service<Redis, RedisClientType>()('Redis') {}

export type RedisConfig = {
  readonly url: Redacted.Redacted
}

export const make = (config: RedisConfig) =>
  Effect.acquireRelease(
    Effect.gen(function* () {
      const runFork = Effect.runForkWith(yield* Effect.context())
      const client: RedisClientType = createClient({ url: Redacted.value(config.url) })

      // Without a listener a dropped connection crashes the process. Commands still fail
      // while Redis is unavailable and the client keeps reconnecting.
      client.on('error', (error: Error) => {
        runFork(Effect.logWarning('[Redis]: Connection error.', error.name))
      })

      yield* Effect.tryPromise({
        try: () => client.connect(),
        catch: cause => new RedisError({ cause }),
      })

      return client
    }),
    // close() throws synchronously when the connection is already gone.
    client => Effect.tryPromise(() => client.close()).pipe(Effect.ignore),
  )

export const layer = (config: RedisConfig) =>
  Layer.effect(
    Redis,
    make(config).pipe(Effect.tap(() => Effect.logInfo('[Redis]: Connection established.'))),
  )
