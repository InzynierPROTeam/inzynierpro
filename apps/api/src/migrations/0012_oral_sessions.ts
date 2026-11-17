import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE oral_learning_rounds (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    round_number integer NOT NULL CHECK (round_number > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE
  )`
  yield* sql`CREATE TRIGGER oral_learning_rounds_updated_at BEFORE UPDATE ON oral_learning_rounds FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_question_coverage (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    question_id uuid NOT NULL,
    oral_revision_id uuid NOT NULL,
    round_number integer NOT NULL CHECK (round_number > 0),
    covered_at timestamptz(3) NOT NULL DEFAULT now(),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id, question_id),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (qualification_path_id, question_id) REFERENCES path_oral_questions(qualification_path_id, question_id),
    FOREIGN KEY (question_id, oral_revision_id) REFERENCES oral_revisions(question_id, id)
  )`
  yield* sql`CREATE TRIGGER oral_question_coverage_updated_at BEFORE UPDATE ON oral_question_coverage FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_study_sessions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    kind text NOT NULL DEFAULT 'study' CHECK (kind IN ('study','review','favourites')),
    category_id uuid REFERENCES oral_question_categories(id),
    user_exam_goal_version integer NOT NULL,
    question_count integer NOT NULL CHECK (question_count > 0),
    current_position integer NOT NULL DEFAULT 1 CHECK (current_position BETWEEN 1 AND question_count),
    ended_at timestamptz(3),
    last_activity_at timestamptz(3) NOT NULL DEFAULT now(),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, qualification_path_id, user_exam_goal_version) REFERENCES user_exam_goals(user_id, qualification_path_id, version) ON DELETE CASCADE,
    CONSTRAINT oral_study_sessions_scope CHECK (kind <> 'study' OR category_id IS NOT NULL),
    CONSTRAINT oral_favorites_scope CHECK (kind <> 'favourites' OR category_id IS NULL),
    UNIQUE (id, user_id, qualification_path_id, user_exam_goal_version)
  )`
  yield* sql`CREATE TRIGGER oral_study_sessions_updated_at BEFORE UPDATE ON oral_study_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE UNIQUE INDEX oral_study_sessions_one_unfinished ON oral_study_sessions (user_id, qualification_path_id, kind, category_id) NULLS NOT DISTINCT WHERE ended_at IS NULL`
  yield* sql`CREATE INDEX oral_study_sessions_last_activity ON oral_study_sessions (user_id, qualification_path_id, last_activity_at DESC, id DESC)`
  yield* sql`CREATE TABLE oral_study_session_questions (
    study_session_id uuid NOT NULL REFERENCES oral_study_sessions(id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position > 0),
    question_id uuid NOT NULL,
    oral_revision_id uuid NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (study_session_id, position),
    UNIQUE (study_session_id, question_id),
    UNIQUE (study_session_id, position, oral_revision_id),
    FOREIGN KEY (question_id, oral_revision_id) REFERENCES oral_revisions(question_id, id)
  )`
  yield* sql`CREATE TABLE oral_study_self_assessments (
    study_session_id uuid NOT NULL,
    position integer NOT NULL,
    oral_revision_id uuid NOT NULL,
    self_assessment text NOT NULL CHECK (self_assessment IN ('hard','medium','easy')),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (study_session_id, position),
    FOREIGN KEY (study_session_id, position, oral_revision_id) REFERENCES oral_study_session_questions(study_session_id, position, oral_revision_id) ON DELETE CASCADE
  )`
})
