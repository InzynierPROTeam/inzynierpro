import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class StudyReadError extends Data.TaggedError('StudyReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class StudyWriteError extends Data.TaggedError('StudyWriteError')<{
  readonly cause: SqlError.SqlError
}> {}

export class StudyDocumentNotFound extends Data.TaggedError('StudyDocumentNotFound') {}
