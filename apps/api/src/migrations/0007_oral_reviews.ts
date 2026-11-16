import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`ALTER TABLE oral_study_sessions ADD COLUMN kind text NOT NULL DEFAULT 'study' CHECK (kind IN ('study','review'))`
  yield* sql`ALTER TABLE oral_study_sessions ALTER COLUMN category_id DROP NOT NULL`
  yield* sql`ALTER TABLE oral_study_sessions ADD CONSTRAINT oral_study_sessions_scope CHECK (kind <> 'study' OR category_id IS NOT NULL)`
  yield* sql`DROP INDEX oral_study_sessions_one_unfinished`
  yield* sql`CREATE UNIQUE INDEX oral_study_sessions_one_unfinished ON oral_study_sessions (user_id,qualification_path_id,kind,category_id) NULLS NOT DISTINCT WHERE ended_at IS NULL`
})
