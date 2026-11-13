import { Clock, DateTime, Duration, Effect, Layer } from 'effect'

// Catalogue HTTP tests share a fixed business date, independent of the host calendar.
export const catalogueTestTime = DateTime.makeUnsafe('2026-11-13T12:00:00.000Z')

export const fixedWallClockLayer = (now: DateTime.Utc) =>
  Layer.effect(
    Clock.Clock,
    Effect.gen(function* () {
      const live = yield* Clock.Clock
      const millis = DateTime.toEpochMillis(now)
      const nanos = Duration.toNanosUnsafe(Duration.millis(millis))

      return {
        currentTimeMillisUnsafe: () => millis,
        currentTimeMillis: Effect.succeed(millis),
        currentTimeNanosUnsafe: () => nanos,
        currentTimeNanos: Effect.succeed(nanos),
        // Network timeouts and monotonic durations continue using the live clock.
        monotonicTimeNanosUnsafe: () => live.monotonicTimeNanosUnsafe(),
        monotonicTimeNanos: live.monotonicTimeNanos,
        sleep: (duration: Duration.Duration) => live.sleep(duration),
      }
    }),
  )
