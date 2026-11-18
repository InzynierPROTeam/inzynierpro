import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE exam_blueprints (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    created_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TABLE exam_blueprint_versions (
    blueprint_id uuid NOT NULL REFERENCES exam_blueprints(id),
    version integer NOT NULL CHECK (version > 0),
    duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
    pass_threshold integer NOT NULL CHECK (pass_threshold > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (blueprint_id, version)
  )`
  yield* sql`CREATE TABLE exam_blueprint_sections (
    blueprint_id uuid NOT NULL,
    version integer NOT NULL,
    position integer NOT NULL CHECK (position > 0),
    name text NOT NULL CHECK (length(name) > 0),
    question_count integer NOT NULL CHECK (question_count > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (blueprint_id, version, position),
    FOREIGN KEY (blueprint_id, version) REFERENCES exam_blueprint_versions(blueprint_id, version)
  )`
  yield* sql`CREATE TABLE exam_blueprint_section_documents (
    blueprint_id uuid NOT NULL,
    version integer NOT NULL,
    section_position integer NOT NULL,
    document_id uuid NOT NULL REFERENCES reference_documents(id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (blueprint_id, version, section_position, document_id),
    FOREIGN KEY (blueprint_id, version, section_position) REFERENCES exam_blueprint_sections(blueprint_id, version, position)
  )`
  yield* sql`CREATE FUNCTION protect_exam_blueprint_version() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'Exam blueprint versions are immutable';
    END;
  $$`
  yield* sql`CREATE TRIGGER exam_blueprint_versions_immutable BEFORE UPDATE OR DELETE ON exam_blueprint_versions FOR EACH ROW EXECUTE FUNCTION protect_exam_blueprint_version()`
  yield* sql`CREATE TRIGGER exam_blueprint_sections_immutable BEFORE UPDATE OR DELETE ON exam_blueprint_sections FOR EACH ROW EXECUTE FUNCTION protect_exam_blueprint_version()`
  yield* sql`CREATE TRIGGER exam_blueprint_section_documents_immutable BEFORE UPDATE OR DELETE ON exam_blueprint_section_documents FOR EACH ROW EXECUTE FUNCTION protect_exam_blueprint_version()`
  yield* sql`CREATE TABLE exam_blueprint_paths (
    qualification_path_id uuid PRIMARY KEY REFERENCES qualification_paths(id),
    blueprint_id uuid NOT NULL REFERENCES exam_blueprints(id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX exam_blueprint_paths_blueprint ON exam_blueprint_paths (blueprint_id)`
  yield* sql`CREATE TRIGGER exam_blueprint_paths_updated_at BEFORE UPDATE ON exam_blueprint_paths FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE mock_exam_attempts (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    blueprint_id uuid NOT NULL,
    blueprint_version integer NOT NULL,
    user_exam_goal_version integer NOT NULL,
    earned_xp integer NOT NULL DEFAULT 0 CHECK (earned_xp >= 0),
    status text NOT NULL CHECK (status IN ('in-progress','paused','finished','abandoned')),
    started_at timestamptz(3) NOT NULL,
    finished_at timestamptz(3),
    end_reason text CHECK (end_reason IN ('submitted','time-expired')),
    correct_count integer CHECK (correct_count >= 0),
    incorrect_count integer CHECK (incorrect_count >= 0),
    unanswered_count integer CHECK (unanswered_count >= 0),
    percent integer CHECK (percent BETWEEN 0 AND 100),
    passed boolean,
    active_seconds integer CHECK (active_seconds >= 0),
    pause_count integer CHECK (pause_count >= 0),
    pause_seconds integer CHECK (pause_seconds >= 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, qualification_path_id, user_exam_goal_version) REFERENCES user_exam_goals(user_id, qualification_path_id, version) ON DELETE CASCADE,
    FOREIGN KEY (blueprint_id, blueprint_version) REFERENCES exam_blueprint_versions(blueprint_id, version),
    UNIQUE (id, user_id, qualification_path_id, user_exam_goal_version)
  )`
  yield* sql`CREATE TRIGGER mock_exam_attempts_updated_at BEFORE UPDATE ON mock_exam_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE UNIQUE INDEX mock_exam_attempts_one_unfinished ON mock_exam_attempts (user_id, qualification_path_id) WHERE status IN ('in-progress','paused')`
  yield* sql`CREATE INDEX mock_exam_attempts_history ON mock_exam_attempts (user_id, qualification_path_id, started_at DESC, id DESC)`
  yield* sql`CREATE TABLE mock_exam_attempt_pauses (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    attempt_id uuid NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
    paused_at timestamptz(3) NOT NULL,
    ended_at timestamptz(3) CHECK (ended_at >= paused_at),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX mock_exam_attempt_pauses_attempt ON mock_exam_attempt_pauses (attempt_id, paused_at)`
  yield* sql`CREATE UNIQUE INDEX mock_exam_attempt_pauses_one_open ON mock_exam_attempt_pauses (attempt_id) WHERE ended_at IS NULL`
  yield* sql`CREATE TRIGGER mock_exam_attempt_pauses_updated_at BEFORE UPDATE ON mock_exam_attempt_pauses FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE mock_exam_attempt_section_results (
    attempt_id uuid NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
    position integer NOT NULL,
    question_count integer NOT NULL CHECK (question_count >= 0),
    correct_count integer NOT NULL CHECK (correct_count BETWEEN 0 AND question_count),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (attempt_id, position)
  )`
  yield* sql`CREATE TABLE mock_exam_attempt_questions (
    attempt_id uuid NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position > 0),
    section_position integer NOT NULL CHECK (section_position > 0),
    question_id uuid NOT NULL,
    question_revision_id uuid NOT NULL,
    selected_answer_id uuid,
    scored_withdrawn boolean,
    is_flagged boolean NOT NULL DEFAULT false,
    version integer NOT NULL CHECK (version > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (attempt_id, position),
    UNIQUE (attempt_id, question_id),
    UNIQUE (attempt_id, position, question_revision_id),
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id)
  )`
  yield* sql`CREATE TABLE mock_exam_attempt_answer_options (
    attempt_id uuid NOT NULL,
    position integer NOT NULL,
    question_revision_id uuid NOT NULL,
    option_position smallint NOT NULL CHECK (option_position BETWEEN 1 AND 3),
    question_answer_id uuid NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (attempt_id, position, option_position),
    UNIQUE (attempt_id, position, question_answer_id),
    FOREIGN KEY (attempt_id, position, question_revision_id) REFERENCES mock_exam_attempt_questions(attempt_id, position, question_revision_id) ON DELETE CASCADE,
    FOREIGN KEY (question_revision_id, question_answer_id) REFERENCES question_answers(question_revision_id, id)
  )`
  yield* sql`CREATE TRIGGER mock_exam_attempt_questions_updated_at BEFORE UPDATE ON mock_exam_attempt_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`ALTER TABLE mock_exam_attempt_questions ADD FOREIGN KEY (attempt_id, position, selected_answer_id) REFERENCES mock_exam_attempt_answer_options(attempt_id, position, question_answer_id)`
  yield* sql`ALTER TABLE written_learning_events ADD FOREIGN KEY (mock_exam_attempt_id, user_id, qualification_path_id, user_exam_goal_version) REFERENCES mock_exam_attempts(id, user_id, qualification_path_id, user_exam_goal_version) ON DELETE CASCADE`
  yield* sql`ALTER TABLE written_learning_events ADD FOREIGN KEY (mock_exam_attempt_id, attempt_position) REFERENCES mock_exam_attempt_questions(attempt_id, position) ON DELETE CASCADE`
})
