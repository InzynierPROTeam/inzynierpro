import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE written_question_coverage (
    user_id uuid NOT NULL, qualification_path_id uuid NOT NULL, question_id uuid NOT NULL, question_revision_id uuid NOT NULL,
    covered_at timestamptz(3) NOT NULL DEFAULT now(), PRIMARY KEY (user_id, qualification_path_id, question_id),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (qualification_path_id, question_id) REFERENCES path_questions(qualification_path_id, question_id),
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER written_question_coverage_updated_at BEFORE UPDATE ON written_question_coverage FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
