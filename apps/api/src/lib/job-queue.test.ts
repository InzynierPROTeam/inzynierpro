import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

import { Deferred, Effect, Layer, Ref, Schedule, type Scope, Tracer } from 'effect'
import { expect, test } from 'vitest'
import { makeJobQueue } from '~api/lib/job-queue.js'
import {
  ControlledFailure,
  Greeting,
  makeTestStoreLayer,
  uniqueQueue,
} from '~api/test/job-queue.js'

type StoreServices = Layer.Success<ReturnType<typeof makeTestStoreLayer>>

const run = <A, E>(
  effect: Effect.Effect<A, E, StoreServices | Scope.Scope>,
  storeLayer = makeTestStoreLayer(),
) => Effect.runPromise(effect.pipe(Effect.scoped, Effect.provide(storeLayer)))

const fastRetries = { maxAttempts: 3, retrySchedule: Schedule.spaced('10 millis') }

test('a failed job is retried until its handler succeeds', { timeout: 20_000 }, async () => {
  const attempts = await run(
    Effect.gen(function* () {
      const queue = yield* makeJobQueue({ name: uniqueQueue(), schema: Greeting, ...fastRetries })
      const seen = yield* Ref.make<ReadonlyArray<number>>([])
      const done = yield* Deferred.make<void>()

      yield* queue.offer({ name: 'Ala' })

      yield* queue
        .process((_, job) =>
          Ref.update(seen, all => [...all, job.attempts]).pipe(
            Effect.andThen(
              job.attempts < 3
                ? Effect.fail(new ControlledFailure())
                : Deferred.succeed(done, undefined),
            ),
          ),
        )
        .pipe(Effect.forkScoped)

      yield* Deferred.await(done)

      return yield* Ref.get(seen)
    }),
  )

  expect(attempts).toEqual([1, 2, 3])
})

test(
  'a handler keyed by the job id applies its effect once over repeated deliveries',
  { timeout: 20_000 },
  async () => {
    const { offeredId, deliveries, effects } = await run(
      Effect.gen(function* () {
        const queue = yield* makeJobQueue({ name: uniqueQueue(), schema: Greeting, ...fastRetries })
        const deliveries = yield* Ref.make(0)
        // Stands in for a table with a unique key on the job id and `ON CONFLICT DO NOTHING`.
        const effects = yield* Ref.make<ReadonlySet<string>>(new Set())
        const done = yield* Deferred.make<void>()

        const offeredId = yield* queue.offer({ name: 'Iza' })

        yield* queue
          .process((_, job) =>
            Effect.gen(function* () {
              yield* Ref.update(deliveries, count => count + 1)
              // The effect happens before the failure, as when a worker dies before acknowledging.
              yield* Ref.update(effects, ids => new Set([...ids, job.id]))

              if (job.attempts < 3) {
                return yield* new ControlledFailure()
              }

              yield* Deferred.succeed(done, undefined)
            }),
          )
          .pipe(Effect.forkScoped)

        yield* Deferred.await(done)

        return {
          offeredId,
          deliveries: yield* Ref.get(deliveries),
          effects: [...(yield* Ref.get(effects))],
        }
      }),
    )

    expect(deliveries).toBe(3)
    expect(effects).toEqual([offeredId])
  },
)

test(
  'a job left by a stopped worker is completed after a restart',
  { timeout: 20_000 },
  async () => {
    const name = uniqueQueue()

    // The first worker process takes the job and stops before finishing it, as on a deployment.
    await run(
      Effect.gen(function* () {
        const queue = yield* makeJobQueue({ name, schema: Greeting, ...fastRetries })
        const started = yield* Deferred.make<void>()

        yield* queue.offer({ name: 'Ola' })
        yield* queue
          .process(() => Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never)))
          .pipe(Effect.forkScoped)

        yield* Deferred.await(started)
      }),
    )

    // A fresh store with its own connections, as in a restarted process, finds the job in PostgreSQL.
    const attempts = await run(
      Effect.gen(function* () {
        const queue = yield* makeJobQueue({ name, schema: Greeting, ...fastRetries })
        const done = yield* Deferred.make<number>()

        yield* queue
          .process((_, job) => Deferred.succeed(done, job.attempts))
          .pipe(Effect.forkScoped)

        return yield* Deferred.await(done)
      }),
    )

    // The interrupted attempt is released without counting against the job's attempts.
    expect(attempts).toBe(1)
  },
)

test('a job runs in the trace of the operation that offered it', { timeout: 20_000 }, async () => {
  const spans: Array<Tracer.Span> = []

  const tracer = Tracer.make({
    span: options => {
      const span = new Tracer.NativeSpan(options)

      spans.push(span)

      return span
    },
  })

  const offeredIn = await run(
    Effect.gen(function* () {
      const queue = yield* makeJobQueue({ name: uniqueQueue(), schema: Greeting, ...fastRetries })
      const done = yield* Deferred.make<void>()

      const offeredIn = yield* queue
        .offer({ name: 'Ela' })
        .pipe(Effect.andThen(Effect.currentSpan), Effect.withSpan('Test.request'))

      yield* queue.process(() => Deferred.succeed(done, undefined)).pipe(Effect.forkScoped)
      yield* Deferred.await(done)

      return offeredIn.traceId
    }).pipe(Effect.withTracer(tracer)),
  )

  const processed = spans.find(span => span.name === 'JobQueue.process')

  expect(processed?.traceId).toBe(offeredIn)
  expect(processed?.attributes.get('app.job.attempt')).toBe(1)
})

// Takes a job of the queue it is given, writes `JOB_STARTED` and hangs until it is killed.
const workerScript = fileURLToPath(new URL('../test/job-queue-worker.ts', import.meta.url))

test(
  'a job held by a killed worker is taken again once its lock expires',
  { timeout: 30_000 },
  async () => {
    const name = uniqueQueue()

    await run(
      makeJobQueue({ name, schema: Greeting, ...fastRetries }).pipe(
        Effect.andThen(queue => queue.offer({ name: 'Ula' })),
      ),
    )

    // A separate process, so nothing in this one can release the job when it dies.
    const worker = spawn(process.execPath, ['--import', 'tsx', workerScript, name], {
      stdio: ['ignore', 'pipe', 'inherit'],
    })

    try {
      for await (const line of createInterface({ input: worker.stdout })) {
        if (line === 'JOB_STARTED') {
          break
        }
      }
    } finally {
      worker.kill('SIGKILL')
    }

    await once(worker, 'exit')

    const attempts = await run(
      Effect.gen(function* () {
        const queue = yield* makeJobQueue({ name, schema: Greeting, ...fastRetries })
        const done = yield* Deferred.make<number>()

        yield* queue
          .process((_, job) => Deferred.succeed(done, job.attempts))
          .pipe(Effect.forkScoped)

        return yield* Deferred.await(done)
      }),
      makeTestStoreLayer({ lockExpiration: '1 second' }),
    )

    // Unlike a graceful stop, the killed worker's attempt counts.
    expect(attempts).toBe(2)
  },
)
