import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class XpReadError extends Data.TaggedError('XpReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class XpWriteError extends Data.TaggedError('XpWriteError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}
