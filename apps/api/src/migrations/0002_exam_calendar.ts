import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE general_chambers (id uuid PRIMARY KEY, name text NOT NULL,
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER general_chambers_updated_at BEFORE UPDATE ON general_chambers FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE exam_sessions (
    id uuid PRIMARY KEY, general_chamber_id uuid NOT NULL REFERENCES general_chambers(id), name text NOT NULL,
    written_at timestamptz(3) NOT NULL, oral_planning_at timestamptz(3) NOT NULL,
    selection_closes_at timestamptz(3) NOT NULL, published boolean NOT NULL DEFAULT false,
    CHECK (selection_closes_at >= written_at), CHECK (selection_closes_at >= oral_planning_at),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER exam_sessions_updated_at BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
