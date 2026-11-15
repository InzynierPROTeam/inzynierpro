import { databaseLayer } from '@inzpro/db'
import { Duration, Effect, Layer, Schedule } from 'effect'
import { PersistedQueue } from 'effect/persistence'
import { processEnv } from '~api/lib/env.js'
import { jobQueueStoreLayer } from '~api/lib/job-queue.js'
import { processTelemetryLayer } from '~api/lib/observability.js'
import { recordJobBacklog } from '~api/modules/background-jobs/application/job-backlog.service.js'
import { BackgroundJobsReaderLive } from '~api/modules/background-jobs/infrastructure/background-jobs.reader.postgres.js'

/**
 * Modules, queues and connections shared by the worker and the operator scripts. The HTTP server
 * uses the same modules and configuration from its own entry point (ADR-0012). Building the job
 * store runs Effect's own migrations of the job table.
 */
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
  // A failed reading is logged and the next one runs on schedule.
  Effect.catchCause(cause => Effect.logWarning('Could not read the background job backlog', cause)),
  Effect.repeat(Schedule.spaced(Duration.minutes(1))),
)

// Completed jobs are kept for Effect's default 30 days, so offering an existing job id within that
// time is still ignored; failed jobs stay until handled. Each worker runs the cleanup; the batched
// deletes are safe to repeat, though one instance would do.
const CleanupLive = PersistedQueue.layerCleanup()

/**
 * The worker process: runs jobs until SIGTERM, then releases the job it holds for the next worker.
 * A module's queue is processed by forking its `process` loop here, with the module's layers
 * merged into `BackgroundJobsLive`.
 */
export const WorkerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.forkScoped(recordBacklog)

    yield* Effect.logInfo('Worker started')
    yield* Effect.addFinalizer(() => Effect.logInfo('Worker stopped'))
  }),
).pipe(Layer.provideMerge(CleanupLive), Layer.provideMerge(BackgroundJobsLive))
