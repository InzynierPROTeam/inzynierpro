import { Data, type Cause, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class ProfileReadError extends Data.TaggedError('ProfileReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class ProfileWriteError extends Data.TaggedError('ProfileWriteError')<{
  readonly cause: Cause.UnknownError | Schema.SchemaError
}> {}
