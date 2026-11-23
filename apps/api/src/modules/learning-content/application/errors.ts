import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class LearningContentWriteError extends Data.TaggedError('LearningContentWriteError')<{
  readonly cause: SqlError.SqlError
}> {}

export class LearningContentReadError extends Data.TaggedError('LearningContentReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class FileStorageError extends Data.TaggedError('FileStorageError')<{
  readonly cause: unknown
}> {}
