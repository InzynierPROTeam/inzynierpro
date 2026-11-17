import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE written_learning_events (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    user_exam_goal_version integer NOT NULL,
    question_id uuid NOT NULL,
    question_revision_id uuid NOT NULL,
    mode text NOT NULL CHECK (mode IN ('study','review','favourites','exam')),
    is_correct boolean NOT NULL,
    assistance text NOT NULL CHECK (assistance IN ('none','note','explanation')),
    answered_at timestamptz(3) NOT NULL,
    study_session_id uuid,
    position integer,
    mock_exam_attempt_id uuid,
    attempt_position integer,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    CHECK (CASE WHEN mode='exam'
      THEN study_session_id IS NULL AND position IS NULL AND mock_exam_attempt_id IS NOT NULL AND attempt_position IS NOT NULL AND assistance='none'
      ELSE study_session_id IS NOT NULL AND position IS NOT NULL AND mock_exam_attempt_id IS NULL AND attempt_position IS NULL END),
    UNIQUE (study_session_id, position),
    UNIQUE (mock_exam_attempt_id, attempt_position),
    FOREIGN KEY (study_session_id, position) REFERENCES written_study_answers(study_session_id, position) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id, user_id, qualification_path_id, user_exam_goal_version) REFERENCES written_study_sessions(id, user_id, qualification_path_id, user_exam_goal_version) ON DELETE CASCADE,
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id)
  )`
  yield* sql`CREATE INDEX written_learning_events_question_time ON written_learning_events (user_id, qualification_path_id, question_id, answered_at)`
  yield* sql`CREATE TABLE written_review_states (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    question_id uuid NOT NULL,
    substantive_revision_id uuid NOT NULL,
    learning_event_id uuid NOT NULL REFERENCES written_learning_events(id) ON DELETE CASCADE,
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
    FOREIGN KEY (qualification_path_id, question_id) REFERENCES path_questions(qualification_path_id, question_id),
    FOREIGN KEY (question_id, substantive_revision_id) REFERENCES question_revisions(question_id, id)
  )`
  yield* sql`CREATE TRIGGER written_review_states_updated_at BEFORE UPDATE ON written_review_states FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE INDEX written_review_states_due ON written_review_states (user_id, qualification_path_id, due_at)`
})
