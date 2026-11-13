import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE specializations (id uuid PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL, description text, general_chamber_id uuid NOT NULL REFERENCES general_chambers(id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER specializations_updated_at BEFORE UPDATE ON specializations FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE qualification_kinds (id uuid PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL,
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER qualification_kinds_updated_at BEFORE UPDATE ON qualification_kinds FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE qualification_scopes (id uuid PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL,
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER qualification_scopes_updated_at BEFORE UPDATE ON qualification_scopes FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE qualification_paths (
 id uuid PRIMARY KEY DEFAULT uuidv7(), name text NOT NULL,
 specialization_id uuid NOT NULL REFERENCES specializations(id),
 qualification_kind_id uuid NOT NULL REFERENCES qualification_kinds(id),
 qualification_scope_id uuid NOT NULL REFERENCES qualification_scopes(id),
 published boolean NOT NULL DEFAULT false,
 UNIQUE (specialization_id, qualification_kind_id, qualification_scope_id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER qualification_paths_updated_at BEFORE UPDATE ON qualification_paths FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
