import { Context, type Effect } from 'effect'
import type {
  FailedJob,
  JobBacklog,
} from '~api/modules/background-jobs/domain/job-backlog.model.js'

import type { BackgroundJobsReadError } from './errors.js'

export class BackgroundJobsReader extends Context.Service<
  BackgroundJobsReader,
  {
    // One entry for every queue with jobs in the table, ordered by queue name.
    readonly backlog: Effect.Effect<ReadonlyArray<JobBacklog>, BackgroundJobsReadError>
    // The most recently failed jobs of all queues, newest first.
    readonly failedJobs: Effect.Effect<ReadonlyArray<FailedJob>, BackgroundJobsReadError>
  }
>()('api/modules/background-jobs/BackgroundJobsReader') {}
