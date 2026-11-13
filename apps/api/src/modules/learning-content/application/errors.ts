import { Data } from 'effect'
import type { SqlError } from 'effect/sql'

export class LearningContentWriteError extends Data.TaggedError('LearningContentWriteError')<{
  readonly cause: SqlError.SqlError
}> {}
