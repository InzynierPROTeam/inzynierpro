import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

export const privatePathTables = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const rows = yield* sql`SELECT c.table_name FROM information_schema.columns c
 JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name
 WHERE c.table_schema=current_schema() AND t.table_type='BASE TABLE' AND c.column_name IN ('user_id','qualification_path_id')
 GROUP BY c.table_name HAVING count(*)=2 ORDER BY c.table_name`

  const tables = yield* Schema.decodeUnknownEffect(
    Schema.Array(Schema.Struct({ tableName: Schema.String })),
  )(rows)

  return tables.map(({ tableName }) => tableName)
})
