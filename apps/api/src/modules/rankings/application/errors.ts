import { Data, type Schema } from 'effect'
import type { SqlError } from 'effect/sql'

export class RankingReadError extends Data.TaggedError('RankingReadError')<{
  readonly cause: SqlError.SqlError | Schema.SchemaError
}> {}
