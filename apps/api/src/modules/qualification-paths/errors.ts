import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class QualificationPathsReadError extends Data.TaggedError('QualificationPathsReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class QualificationPathsWriteError extends Data.TaggedError('QualificationPathsWriteError')<{
  readonly cause: SqlError.SqlError
}> {}
