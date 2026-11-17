import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE oral_favorite_questions (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES oral_questions(id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id,question_id)
  )`
  yield* sql`CREATE TABLE oral_question_notes (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES oral_questions(id),
    oral_revision_id uuid NOT NULL,
    body text NOT NULL CHECK (char_length(body) <= 2000 AND body ~ '[^[:space:]]'),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id,question_id),
    FOREIGN KEY (question_id,oral_revision_id) REFERENCES oral_revisions(question_id,id)
  )`
  yield* sql`CREATE TRIGGER oral_question_notes_updated_at BEFORE UPDATE ON oral_question_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
