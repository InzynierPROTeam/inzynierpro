// Usage: pnpm --filter @inzpro/api worker:status
import { NodeRuntime } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { EnvProviderLive } from '~api/lib/env-provider.js'
import { BackgroundJobsReader } from '~api/modules/background-jobs/application/background-jobs.reader.js'
import { jobBacklogAnnotations } from '~api/modules/background-jobs/application/job-backlog.service.js'
import { BackgroundJobsLive } from '~api/worker/worker.js'

Effect.gen(function* () {
  const backgroundJobsReader = yield* BackgroundJobsReader
  const backlog = yield* backgroundJobsReader.backlog

  if (backlog.length === 0) {
    yield* Effect.logInfo('No background jobs')
  }

  yield* Effect.forEach(
    backlog,
    queue =>
      Effect.logInfo('Background job backlog').pipe(
        Effect.annotateLogs(jobBacklogAnnotations(queue)),
      ),
    { discard: true },
  )

  yield* Effect.forEach(
    yield* backgroundJobsReader.failedJobs,
    job =>
      Effect.logWarning('Failed background job').pipe(
        Effect.annotateLogs({
          'app.job.queue': job.queue,
          'app.job.id': job.id,
          'app.job.attempt': job.attempts,
          'app.job.last_failure': job.lastFailure,
        }),
      ),
    { discard: true },
  )
}).pipe(
  Effect.provide(BackgroundJobsLive.pipe(Layer.provide(EnvProviderLive))),
  NodeRuntime.runMain,
)
