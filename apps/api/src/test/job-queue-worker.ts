import { Effect } from 'effect'
import { makeJobQueue } from '~api/lib/job-queue.js'
import { Greeting, makeTestStoreLayer } from '~api/test/job-queue.js'

const [name = ''] = process.argv.slice(2)

await Effect.gen(function* () {
  const queue = yield* makeJobQueue({
    name,
    schema: Greeting,
    maxAttempts: 3,
  })

  return yield* queue.process(() =>
    Effect.sync(() => process.stdout.write('JOB_STARTED\n')).pipe(Effect.andThen(Effect.never)),
  )
}).pipe(Effect.scoped, Effect.provide(makeTestStoreLayer()), Effect.runPromise)
