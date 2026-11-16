import { databaseLayer } from '@inzpro/db'
import { Duration, Effect, Layer, Schedule } from 'effect'
import { PersistedQueue } from 'effect/persistence'
import { processEnv } from '~api/lib/env.js'
import { jobQueueStoreLayer } from '~api/lib/job-queue.js'
import { processTelemetryLayer } from '~api/lib/observability.js'
import { recordJobBacklog } from '~api/modules/background-jobs/application/job-backlog.service.js'
import { BackgroundJobsReaderLive } from '~api/modules/background-jobs/infrastructure/background-jobs.reader.postgres.js'

// EXTERNAL: Building Effect's SQL job store also runs its migrations.
export const BackgroundJobsLive = Layer.unwrap(
  Effect.map(processEnv, config =>
    BackgroundJobsReaderLive.pipe(
      Layer.provideMerge(jobQueueStoreLayer()),
      Layer.provideMerge(databaseLayer({ url: config.DATABASE_URL })),
      Layer.provideMerge(processTelemetryLayer('inzpro-worker', config)),
    ),
  ),
)

const recordBacklog = recordJobBacklog().pipe(
  Effect.catchCause(cause => Effect.logWarning('Could not read the background job backlog', cause)),
  Effect.repeat(Schedule.spaced(Duration.minutes(1))),
)

// EXTERNAL: Effect cleanup retains completed jobs for 30 days by default; their IDs remain deduplicated during that period. Failed jobs remain stored.
const CleanupLive = PersistedQueue.layerCleanup()

export const WorkerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.forkScoped(recordBacklog)

    yield* Effect.logInfo('Worker started')
    yield* Effect.addFinalizer(() => Effect.logInfo('Worker stopped'))
  }),
).pipe(Layer.provideMerge(CleanupLive), Layer.provideMerge(BackgroundJobsLive))
