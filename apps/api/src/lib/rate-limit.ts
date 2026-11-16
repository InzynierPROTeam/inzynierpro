import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { RateLimitExceeded } from '@inzpro/api-contracts/utils/api-error'
import { RateLimiter, type RateLimitResult } from '@inzpro/redis/rate-limiter'
import { Context, Data, type Duration, Effect, Option, Ref } from 'effect'
import { Digest } from 'effect/crypto'
import { Headers, HttpEffect, HttpServerRequest, HttpServerResponse } from 'effect/http'

export type RateLimitPolicy = {
  readonly name: string
  readonly limit: number
  readonly window: Duration.Input
  readonly whenStoreUnavailable: 'allow' | 'reject'
}

export const publicReadLimit: RateLimitPolicy = {
  name: 'public-read',
  limit: 120,
  window: '1 minute',
  whenStoreUnavailable: 'allow',
}

export const accountReadLimit: RateLimitPolicy = {
  name: 'account-read',
  limit: 300,
  window: '1 minute',
  whenStoreUnavailable: 'allow',
}

export const accountWriteLimit: RateLimitPolicy = {
  name: 'account-write',
  limit: 30,
  window: '1 minute',
  whenStoreUnavailable: 'reject',
}

export const TrustedClientIpHeader = Context.Reference<Option.Option<string>>(
  'api/TrustedClientIpHeader',
  { defaultValue: Option.none },
)

type RateLimitOutcome = Data.TaggedEnum<{
  Allowed: { readonly result: RateLimitResult }
  Exceeded: {
    readonly limit: number
    readonly resetAtUnixSeconds: number
    readonly retryAfterSeconds: number
  }
}>

const RateLimitOutcome = Data.taggedEnum<RateLimitOutcome>()

const CurrentRateLimitOutcome = Context.Reference<
  Option.Option<Ref.Ref<Option.Option<RateLimitOutcome>>>
>('api/CurrentRateLimitOutcome', { defaultValue: Option.none })

const recordOutcome = (outcome: RateLimitOutcome) =>
  Effect.flatMap(
    CurrentRateLimitOutcome,
    Option.match({
      onNone: () => Effect.void,
      onSome: ref => Ref.set(ref, Option.some(outcome)),
    }),
  )

const hashed = (value: string) =>
  Effect.flatMap(Digest.Digest, digest =>
    digest.digestHex(Digest.sha256, new TextEncoder().encode(value)),
  ).pipe(Effect.map(hex => hex.slice(0, 32)))

const consume = Effect.fn('RateLimit.consume')(function* (
  policy: RateLimitPolicy,
  dimension: 'ip' | 'user',
  subject: string,
) {
  const limiter = yield* RateLimiter

  yield* Effect.annotateCurrentSpan({
    'app.rate_limit.policy': policy.name,
    'app.rate_limit.dimension': dimension,
  })

  const subjectHash = yield* hashed(subject)

  const result = yield* limiter
    .consume({
      key: `ratelimit:${policy.name}:${dimension}:${subjectHash}`,
      limit: policy.limit,
      window: policy.window,
    })
    .pipe(
      Effect.asSome,
      Effect.catchTags({
        RateLimiterStoreError: error =>
          policy.whenStoreUnavailable === 'allow'
            ? Effect.logWarning('Rate limiter unavailable; request allowed', error).pipe(
                Effect.annotateLogs('app.rate_limit.policy', policy.name),
                Effect.andThen(
                  Effect.annotateCurrentSpan('app.rate_limit.store_unavailable', true),
                ),
                Effect.as(Option.none<RateLimitResult>()),
              )
            : Effect.die(error),
        RateLimitExceeded: exceeded =>
          Effect.logInfo('Rate limit exceeded').pipe(
            Effect.annotateLogs({
              'app.rate_limit.policy': policy.name,
              'app.rate_limit.dimension': dimension,
            }),
            Effect.andThen(Effect.annotateCurrentSpan('app.rate_limit.exceeded', true)),
            Effect.andThen(
              recordOutcome(
                RateLimitOutcome.Exceeded({
                  limit: exceeded.limit,
                  resetAtUnixSeconds: exceeded.resetAtUnixSeconds,
                  retryAfterSeconds: exceeded.retryAfterSeconds,
                }),
              ),
            ),
            Effect.andThen(
              Effect.fail(
                new RateLimitExceeded({
                  type: 'rate_limit_exceeded',
                  message: 'Too many requests. Please try again later.',
                }),
              ),
            ),
          ),
      }),
    )

  if (Option.isSome(result)) {
    yield* recordOutcome(RateLimitOutcome.Allowed({ result: result.value }))
  }
})

const clientAddress = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const header = yield* TrustedClientIpHeader

  return Option.flatMap(header, name => Headers.get(request.headers, name)).pipe(
    Option.map(value => value.trim()),
    Option.orElse(() => request.remoteAddress),
    Option.getOrElse(() => 'unknown'),
  )
})

export const limitByClient = (policy: RateLimitPolicy) =>
  Effect.flatMap(clientAddress, address => consume(policy, 'ip', address))

export const limitByUser = (policy: RateLimitPolicy) =>
  Effect.flatMap(CurrentUser, user => consume(policy, 'user', user.id))

const headersFor = RateLimitOutcome.$match({
  Allowed: ({ result }) => ({
    'x-ratelimit-limit': String(result.limit),
    'x-ratelimit-remaining': String(result.remaining),
    'x-ratelimit-reset': String(result.resetAtUnixSeconds),
  }),
  Exceeded: outcome => ({
    'x-ratelimit-limit': String(outcome.limit),
    'x-ratelimit-remaining': '0',
    'x-ratelimit-reset': String(outcome.resetAtUnixSeconds),
    'retry-after': String(outcome.retryAfterSeconds),
  }),
})

export const RateLimitHeadersMiddleware = <E, R>(
  app: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
) =>
  Effect.suspend(() => {
    const outcome = Ref.makeUnsafe(Option.none<RateLimitOutcome>())

    return HttpEffect.withPreResponseHandler(app, (_request, response) =>
      Ref.get(outcome).pipe(
        Effect.map(
          Option.match({
            onNone: () => response,
            onSome: value => HttpServerResponse.setHeaders(response, headersFor(value)),
          }),
        ),
      ),
    ).pipe(Effect.provideService(CurrentRateLimitOutcome, Option.some(outcome)))
  })
