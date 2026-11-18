import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class StreakReadError extends Data.TaggedError('StreakReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class StreakWriteError extends Data.TaggedError('StreakWriteError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}
