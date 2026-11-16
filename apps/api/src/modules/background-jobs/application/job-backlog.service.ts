import { Duration, Effect, Metric, Option } from 'effect'
import type { JobBacklog } from '~api/modules/background-jobs/domain/job-backlog.model.js'

import { BackgroundJobsReader } from './background-jobs.reader.js'

const backgroundJobs = Metric.gauge('app.background_jobs', {
  description: 'Background jobs of a queue in each state.',
})

export const jobBacklogAnnotations = (backlog: JobBacklog) => ({
  'app.job.queue': backlog.queue,
  'app.jobs.waiting': backlog.waiting,
  'app.jobs.running': backlog.running,
  'app.jobs.completed': backlog.completed,
  'app.jobs.failed': backlog.failed,
  'app.jobs.oldest_waiting_seconds': backlog.oldestWaitingAge.pipe(
    Option.map(age => Math.round(Duration.toSeconds(age))),
    Option.getOrNull,
  ),
})

export const recordJobBacklog = Effect.fn('BackgroundJobs.recordJobBacklog')(function* () {
  const backgroundJobsReader = yield* BackgroundJobsReader
  const backlog = yield* backgroundJobsReader.backlog

  yield* Effect.forEach(
    backlog,
    queue =>
      Effect.forEach(
        ['waiting', 'running', 'completed', 'failed'] as const,
        state =>
          Metric.update(
            Metric.withAttributes(backgroundJobs, {
              'app.job.queue': queue.queue,
              'app.job.state': state,
            }),
            queue[state],
          ),
        { discard: true },
      ).pipe(
        Effect.andThen(
          Effect.logDebug('Background job backlog').pipe(
            Effect.annotateLogs(jobBacklogAnnotations(queue)),
          ),
        ),
      ),
    { discard: true },
  )
})
