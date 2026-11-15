import { Effect, Layer, Option, Schedule, type Scope } from 'effect'
import { expect, test } from 'vitest'
import { makeJobQueue } from '~api/lib/job-queue.js'
import { BackgroundJobsReader } from '~api/modules/background-jobs/application/background-jobs.reader.js'
import { BackgroundJobsReaderLive } from '~api/modules/background-jobs/infrastructure/background-jobs.reader.postgres.js'
import {
  ControlledFailure,
  Greeting,
  makeTestStoreLayer,
  uniqueQueue,
} from '~api/test/job-queue.js'

const testLayer = BackgroundJobsReaderLive.pipe(Layer.provideMerge(makeTestStoreLayer()))

const run = <A, E>(effect: Effect.Effect<A, E, Layer.Success<typeof testLayer> | Scope.Scope>) =>
  Effect.runPromise(effect.pipe(Effect.scoped, Effect.provide(testLayer)))

// The reader lists every queue, so each test picks out its own.
const queueBacklog = (name: string) =>
  BackgroundJobsReader.use(backgroundJobsReader => backgroundJobsReader.backlog).pipe(
    Effect.map(backlog => backlog.find(entry => entry.queue === name)),
  )

test('a job failing every attempt is listed as failed', { timeout: 20_000 }, async () => {
  const name = uniqueQueue()

  const { id, backlog, failed } = await run(
    Effect.gen(function* () {
      const queue = yield* makeJobQueue({
        name,
        schema: Greeting,
        maxAttempts: 2,
        retrySchedule: Schedule.spaced('10 millis'),
      })

      const id = yield* queue.offer({ name: 'Ada' })

      yield* queue.process(() => Effect.fail(new ControlledFailure())).pipe(Effect.forkScoped)

      const backlog = yield* queueBacklog(name).pipe(
        Effect.repeat({
          schedule: Schedule.spaced('100 millis'),
          until: entry => entry?.failed === 1,
        }),
      )

      const failed = yield* BackgroundJobsReader.use(
        backgroundJobsReader => backgroundJobsReader.failedJobs,
      )

      return { id, backlog, failed: failed.filter(job => job.queue === name) }
    }),
  )

  expect(backlog).toMatchObject({ waiting: 0, running: 0, completed: 0, failed: 1 })
  expect(failed).toEqual([
    { queue: name, id, attempts: 2, lastFailure: expect.stringContaining('ControlledFailure') },
  ])
})

test('a job offered twice under one id is a single waiting job', async () => {
  const name = uniqueQueue()

  const backlog = await run(
    Effect.gen(function* () {
      const queue = yield* makeJobQueue({ name, schema: Greeting, maxAttempts: 2 })
      const id = crypto.randomUUID()

      yield* queue.offer({ name: 'Ewa' }, { id })
      yield* queue.offer({ name: 'Ewa' }, { id })

      return yield* queueBacklog(name)
    }),
  )

  expect(backlog).toMatchObject({ queue: name, waiting: 1, running: 0, completed: 0, failed: 0 })
  expect(backlog?.oldestWaitingAge.pipe(Option.isSome)).toBe(true)
})
