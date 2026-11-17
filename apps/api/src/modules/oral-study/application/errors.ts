import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class StudyReadError extends Data.TaggedError('StudyReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class StudyWriteError extends Data.TaggedError('StudyWriteError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

export class QuestionNoteWriteError extends Data.TaggedError('QuestionNoteWriteError')<{
  readonly reason: string
}> {}
