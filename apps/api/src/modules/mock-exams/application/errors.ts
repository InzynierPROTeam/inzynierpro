import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class MockExamReadError extends Data.TaggedError('MockExamReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class MockExamWriteError extends Data.TaggedError('MockExamWriteError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}
