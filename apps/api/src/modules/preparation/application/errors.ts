import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class PreparationReadError extends Data.TaggedError('PreparationReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class PreparationWriteError extends Data.TaggedError('PreparationWriteError')<{
  readonly cause: SqlError.SqlError
}> {}
