import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class ExamCalendarReadError extends Data.TaggedError('ExamCalendarReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class ExamCalendarWriteError extends Data.TaggedError('ExamCalendarWriteError')<{
  readonly cause: SqlError.SqlError
}> {}
