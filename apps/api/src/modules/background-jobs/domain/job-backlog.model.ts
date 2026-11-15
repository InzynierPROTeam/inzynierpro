import type { Duration, Option } from 'effect'

/** The state of one queue's jobs, for diagnosing a stuck or failing worker. */
export type JobBacklog = {
  readonly queue: string
  // Jobs ready to run or waiting for a retry delay.
  readonly waiting: number
  // Jobs a worker holds right now, including ones whose worker died before its lock expired.
  readonly running: number
  readonly completed: number
  // Jobs that used up their attempts; they stay until an operator deals with them.
  readonly failed: number
  // How long the longest-ready job has waited for a worker; a retry counts from its delay's end.
  readonly oldestWaitingAge: Option.Option<Duration.Duration>
}

export type FailedJob = {
  readonly queue: string
  readonly id: string
  readonly attempts: number
  // The first line of the last failure, without stack traces.
  readonly lastFailure: string
}
