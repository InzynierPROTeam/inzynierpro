import { Clock, Context, Data, Duration, Effect, Layer, Schema } from 'effect'

import { Redis } from './index.js'

// Token bucket, ported from V1: refills one token every window/limit and never exceeds limit.
// A rejected request does not debit the bucket. Returns { remaining, available tokens }.
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local refillKey = key .. ':refill'
local tokens = tonumber(ARGV[1])
local refillMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local current = tonumber(redis.call('GET', key))
local lastRefill = tonumber(redis.call('GET', refillKey))

if not current or not lastRefill then
  current = limit
  lastRefill = now
end

local elapsed = now - lastRefill
if elapsed > 0 then
  local refillAmount = math.floor(elapsed / refillMs)
  if refillAmount > 0 then
    current = math.min(current + refillAmount, limit)
    lastRefill = lastRefill + (refillAmount * refillMs)
  end
end

local remaining = current - tokens
local ttlMs = refillMs * limit

if remaining < 0 then
  redis.call('SET', key, current, 'PX', ttlMs)
  redis.call('SET', refillKey, lastRefill, 'PX', ttlMs)
  return { remaining, current }
end

redis.call('SET', key, remaining, 'PX', ttlMs)
redis.call('SET', refillKey, lastRefill, 'PX', ttlMs)
return { remaining, current }
`

const ScriptReply = Schema.Tuple([Schema.Int, Schema.Int])

export class RateLimitExceeded extends Data.TaggedError('RateLimitExceeded')<{
  readonly limit: number
  readonly retryAfterSeconds: number
  /** Unix time in seconds when the bucket is full again. */
  readonly resetAt: number
}> {
  override get message() {
    return 'Rate limit exceeded.'
  }
}

export class RateLimiterStoreError extends Data.TaggedError('RateLimiterStoreError')<{
  readonly cause: unknown
}> {
  override get message() {
    return 'Rate limiter store operation failed.'
  }
}

export type RateLimitResult = {
  readonly limit: number
  readonly remaining: number
  /** Unix time in seconds when the bucket is full again. */
  readonly resetAt: number
}

export type RateLimitConsumeOptions = {
  readonly key: string
  readonly limit: number
  readonly window: Duration.Input
}

export class RateLimiter extends Context.Service<
  RateLimiter,
  {
    readonly consume: (
      options: RateLimitConsumeOptions,
    ) => Effect.Effect<RateLimitResult, RateLimitExceeded | RateLimiterStoreError>
  }
>()('RateLimiter') {}

export const layer: Layer.Layer<RateLimiter, never, Redis> = Layer.effect(
  RateLimiter,
  Effect.gen(function* () {
    const redis = yield* Redis

    return RateLimiter.of({
      consume: Effect.fn('RateLimiter.consume')(function* (options: RateLimitConsumeOptions) {
        const windowMs = Duration.toMillis(Duration.fromInputUnsafe(options.window))
        const refillMs = Math.max(1, Math.floor(windowMs / options.limit))
        const now = yield* Clock.currentTimeMillis

        const reply = yield* Effect.tryPromise({
          try: () =>
            redis.eval(TOKEN_BUCKET_SCRIPT, {
              keys: [options.key],
              arguments: ['1', String(refillMs), String(options.limit), String(now)],
            }),
          catch: cause => new RateLimiterStoreError({ cause }),
        })

        const [remaining, available] = yield* Schema.decodeUnknownEffect(ScriptReply)(reply).pipe(
          Effect.mapError(cause => new RateLimiterStoreError({ cause })),
        )

        if (remaining < 0) {
          return yield* new RateLimitExceeded({
            limit: options.limit,
            retryAfterSeconds: Math.max(1, Math.ceil((-remaining * refillMs) / 1000)),
            resetAt: Math.ceil((now + (options.limit - available) * refillMs) / 1000),
          })
        }

        return {
          limit: options.limit,
          remaining,
          resetAt: Math.ceil((now + (options.limit - remaining) * refillMs) / 1000),
        }
      }),
    })
  }),
)
