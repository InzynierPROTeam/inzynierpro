import type { Duration, Option } from 'effect'

export type JobBacklog = {
  readonly queue: string
  readonly waiting: number
  readonly running: number
  readonly completed: number
  readonly failed: number
  readonly oldestWaitingAge: Option.Option<Duration.Duration>
}

export type FailedJob = {
  readonly queue: string
  readonly id: string
  readonly attempts: number
  readonly lastFailure: string
}
