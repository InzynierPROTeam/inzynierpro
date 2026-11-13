import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE user_qualification_paths (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualification_path_id uuid NOT NULL REFERENCES qualification_paths(id),
    access_scope text NOT NULL CHECK (access_scope IN ('written', 'oral', 'both')),
    archived_at timestamptz(3), created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER user_qualification_paths_updated_at BEFORE UPDATE ON user_qualification_paths FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE user_exam_goals (
    user_id uuid NOT NULL, qualification_path_id uuid NOT NULL,
    version integer NOT NULL CHECK (version > 0), exam_session_id uuid NOT NULL REFERENCES exam_sessions(id),
    access_scope text NOT NULL CHECK (access_scope IN ('written', 'oral', 'both')), oral_exam_date timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT now(), PRIMARY KEY (user_id, qualification_path_id, version),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE
)`
  yield* sql`CREATE INDEX user_qualification_paths_updated_at_idx ON user_qualification_paths (user_id, updated_at DESC, qualification_path_id)`
})
