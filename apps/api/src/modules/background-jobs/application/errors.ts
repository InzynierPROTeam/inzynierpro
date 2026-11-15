import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class BackgroundJobsReadError extends Data.TaggedError('BackgroundJobsReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}
