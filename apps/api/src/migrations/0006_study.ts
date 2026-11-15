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
  yield* sql`CREATE TABLE written_study_sessions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    document_id uuid NOT NULL,
    user_exam_goal_version integer NOT NULL,
    question_count integer NOT NULL CHECK (question_count > 0),
    current_position integer NOT NULL DEFAULT 1 CHECK (current_position BETWEEN 1 AND question_count),
    ended_at timestamptz(3),
    -- The main "Continue learning" opens the most recently used session (ADR-0002): starting a
    -- session and answering in it count as use; reading a question does not.
    last_activity_at timestamptz(3) NOT NULL DEFAULT now(),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, qualification_path_id, user_exam_goal_version) REFERENCES user_exam_goals(user_id, qualification_path_id, version) ON DELETE CASCADE,
    FOREIGN KEY (qualification_path_id, document_id) REFERENCES path_documents(qualification_path_id, document_id),
    UNIQUE (id, user_id, qualification_path_id, user_exam_goal_version)
  )`
  yield* sql`CREATE TRIGGER written_study_sessions_updated_at BEFORE UPDATE ON written_study_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  // At most one unfinished session per user, path and document (ADR-0002).
  yield* sql`CREATE UNIQUE INDEX written_study_sessions_one_unfinished ON written_study_sessions (user_id, qualification_path_id, document_id) WHERE ended_at IS NULL`
  yield* sql`CREATE INDEX written_study_sessions_last_activity ON written_study_sessions (user_id, qualification_path_id, last_activity_at DESC, id DESC)`
  yield* sql`CREATE TABLE written_study_session_questions (
    study_session_id uuid NOT NULL REFERENCES written_study_sessions(id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position > 0),
    question_id uuid NOT NULL,
    question_revision_id uuid NOT NULL,
    explanation_opened_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (study_session_id, position),
    UNIQUE (study_session_id, question_id),
    UNIQUE (study_session_id, position, question_revision_id),
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id)
  )`
  yield* sql`CREATE TRIGGER written_study_session_questions_updated_at BEFORE UPDATE ON written_study_session_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE written_study_session_answer_options (
    study_session_id uuid NOT NULL,
    position integer NOT NULL,
    question_revision_id uuid NOT NULL,
    option_position smallint NOT NULL CHECK (option_position BETWEEN 1 AND 3),
    question_answer_id uuid NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (study_session_id, position, option_position),
    UNIQUE (study_session_id, position, question_answer_id),
    FOREIGN KEY (study_session_id, position, question_revision_id) REFERENCES written_study_session_questions(study_session_id, position, question_revision_id) ON DELETE CASCADE,
    FOREIGN KEY (question_revision_id, question_answer_id) REFERENCES question_answers(question_revision_id, id)
  )`
  // One submitted answer per session question: the primary key lets the first one win (ADR-0002).
  // The option key ties the answer to an option the session showed for that question's revision.
  yield* sql`CREATE TABLE written_study_answers (
    study_session_id uuid NOT NULL,
    position integer NOT NULL,
    question_revision_id uuid NOT NULL,
    question_answer_id uuid NOT NULL,
    is_correct boolean NOT NULL,
    is_assisted boolean NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (study_session_id, position),
    FOREIGN KEY (study_session_id, position, question_revision_id) REFERENCES written_study_session_questions(study_session_id, position, question_revision_id) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id, position, question_answer_id) REFERENCES written_study_session_answer_options(study_session_id, position, question_answer_id) ON DELETE CASCADE
  )`
  // Immutable raw evidence of written learning (LearningEvent), the input for later SRS, goals and XP.
  // The study kind is implied by the table (ADR-0005); the source answer is unique, so a retry never duplicates it.
  yield* sql`CREATE TABLE written_learning_events (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    user_exam_goal_version integer NOT NULL,
    question_id uuid NOT NULL,
    question_revision_id uuid NOT NULL,
    mode text NOT NULL CHECK (mode IN ('study')),
    is_correct boolean NOT NULL,
    is_assisted boolean NOT NULL,
    study_session_id uuid NOT NULL,
    position integer NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    UNIQUE (study_session_id, position),
    FOREIGN KEY (study_session_id, position) REFERENCES written_study_answers(study_session_id, position) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id, user_id, qualification_path_id, user_exam_goal_version) REFERENCES written_study_sessions(id, user_id, qualification_path_id, user_exam_goal_version) ON DELETE CASCADE,
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id)
  )`
})
