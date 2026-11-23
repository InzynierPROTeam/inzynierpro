import { databaseLayer } from '@inzpro/db'
import { Duration, Effect, Layer, Schedule } from 'effect'
import { PersistedQueue } from 'effect/persistence'
import { processEnv } from '~api/lib/env.js'
import { jobQueueStoreLayer } from '~api/lib/job-queue.js'
import { processTelemetryLayer } from '~api/lib/observability.js'
import { TransactionLive } from '~api/lib/transaction.js'
import { BackgroundJobsReader } from '~api/modules/background-jobs/application/background-jobs.reader.js'
import { recordJobBacklog } from '~api/modules/background-jobs/application/job-backlog.service.js'
import { BackgroundJobsReaderLive } from '~api/modules/background-jobs/infrastructure/background-jobs.reader.postgres.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import {
  AttemptDeadlineQueueLive,
  processAttemptDeadlines,
} from '~api/modules/mock-exams/application/attempt-deadline.job.js'
import { MockExamReaderLive } from '~api/modules/mock-exams/infrastructure/mock-exam.reader.postgres.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

// EXTERNAL: Building Effect's SQL job store also runs its migrations.
export const BackgroundJobsLive = Layer.unwrap(
  Effect.map(processEnv, config =>
    Layer.mergeAll(
      BackgroundJobsReaderLive,
      AttemptDeadlineQueueLive,
      TransactionLive,
      MockExamReaderLive,
      MockExamRepositoryLive,
      PreparationRepositoryLive,
      PreparationReaderLive,
      StudyReaderLive,
      StudyRepositoryLive,
      ReviewSchedulerLive,
      StreakReaderLive,
      StreakRepositoryLive,
      XpReaderLive,
      XpRepositoryLive,
    ).pipe(
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

const QueueReadinessLive = Layer.effectDiscard(
  BackgroundJobsReader.use(backgroundJobsReader => backgroundJobsReader.backlog),
)

export const WorkerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.forkScoped(recordBacklog)
    yield* Effect.forkScoped(processAttemptDeadlines)

    yield* Effect.logInfo('Worker started')
    yield* Effect.addFinalizer(() => Effect.logInfo('Worker stopped'))
  }),
).pipe(
  Layer.provideMerge(CleanupLive),
  Layer.provideMerge(QueueReadinessLive),
  Layer.provideMerge(BackgroundJobsLive),
)
