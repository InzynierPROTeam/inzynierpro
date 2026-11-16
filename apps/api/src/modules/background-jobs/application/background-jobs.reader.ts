import { Context, type Effect } from 'effect'
import type {
  FailedJob,
  JobBacklog,
} from '~api/modules/background-jobs/domain/job-backlog.model.js'

import type { BackgroundJobsReadError } from './errors.js'

export class BackgroundJobsReader extends Context.Service<
  BackgroundJobsReader,
  {
    readonly backlog: Effect.Effect<ReadonlyArray<JobBacklog>, BackgroundJobsReadError>
    readonly failedJobs: Effect.Effect<ReadonlyArray<FailedJob>, BackgroundJobsReadError>
  }
>()('api/modules/background-jobs/BackgroundJobsReader') {}
