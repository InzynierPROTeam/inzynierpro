import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE oral_review_states (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    question_id uuid NOT NULL,
    substantive_revision_id uuid NOT NULL,
    learning_event_id uuid REFERENCES oral_learning_events(id) ON DELETE CASCADE,
    quiz_id uuid,
    quiz_position integer,
    CONSTRAINT oral_review_states_evidence CHECK (num_nonnulls(learning_event_id, quiz_id) = 1 AND (quiz_id IS NULL) = (quiz_position IS NULL)),
    FOREIGN KEY (quiz_id, quiz_position) REFERENCES oral_session_quiz_answers(quiz_id, position) ON DELETE CASCADE,
    rules_version text NOT NULL CHECK (length(rules_version) > 0),
    due_at timestamptz(3) NOT NULL,
    last_review_at timestamptz(3),
    stability double precision NOT NULL,
    stability_fast double precision NOT NULL,
    difficulty double precision NOT NULL,
    state smallint NOT NULL CHECK (state BETWEEN 0 AND 3),
    schedule_status text NOT NULL CHECK (schedule_status IN ('new','learning','review')),
    reps integer NOT NULL CHECK (reps >= 0),
    lapses integer NOT NULL CHECK (lapses >= 0),
    scheduled_days double precision NOT NULL,
    learning_step integer NOT NULL CHECK (learning_step >= 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id, question_id),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (qualification_path_id, question_id) REFERENCES path_oral_questions(qualification_path_id, question_id),
    FOREIGN KEY (question_id, substantive_revision_id) REFERENCES oral_revisions(question_id, id)
  )`
  yield* sql`CREATE TRIGGER oral_review_states_updated_at BEFORE UPDATE ON oral_review_states FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE INDEX oral_review_states_due ON oral_review_states (user_id, qualification_path_id, due_at)`
})
