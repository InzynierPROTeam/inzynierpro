import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class StudyReadError extends Data.TaggedError('StudyReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

// A write that returns its row also decodes it, so a malformed row is a write failure too.
export class StudyWriteError extends Data.TaggedError('StudyWriteError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}

/**
 * A failed PersonalQuestionNote write. It keeps only the kind of database failure: a constraint
 * error's detail may quote the row, and note content never reaches logs (ADR-0022).
 */
export class QuestionNoteWriteError extends Data.TaggedError('QuestionNoteWriteError')<{
  readonly reason: string
}> {}
