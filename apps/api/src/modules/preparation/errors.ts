import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class PreparationReadError extends Data.TaggedError('PreparationReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class PreparationWriteError extends Data.TaggedError('PreparationWriteError')<{
  readonly cause: SqlError.SqlError
}> {}

export class PathPermissionDenied extends Data.TaggedError('PathPermissionDenied') {}

export class StalePathConfiguration extends Data.TaggedError('StalePathConfiguration') {}

export class StaleExamGoal extends Data.TaggedError('StaleExamGoal') {}
