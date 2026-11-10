import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { RateLimiter, RateLimiterStoreError } from '@inzpro/redis/rate-limiter'
import { Cause, Effect, Exit, Layer } from 'effect'
import { expect, test } from 'vitest'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'

const unavailableStore = Layer.succeed(RateLimiter, {
  consume: () => Effect.fail(new RateLimiterStoreError({ cause: new Error('connection lost') })),
})

const check = (policy: typeof accountReadLimit) =>
  Effect.runPromiseExit(
    limitByUser(policy).pipe(
      Effect.provide(unavailableStore),
      // SAFETY: the limiter reads only the id of the signed-in user.
      Effect.provideService(CurrentUser, { id: 'user-1' } as CurrentUser['Service']),
    ),
  )

test('a read is allowed while the rate-limit store is unavailable', async () => {
  expect(Exit.isSuccess(await check(accountReadLimit))).toBe(true)
})

test('a write fails as a server error while the rate-limit store is unavailable', async () => {
  const exit = await check(accountWriteLimit)

  expect(Exit.isFailure(exit) && Cause.hasDies(exit.cause)).toBe(true)
})
