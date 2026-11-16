import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`CREATE TABLE written_learning_rounds (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    round_number integer NOT NULL CHECK (round_number > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE
  )`
  yield* sql`CREATE TRIGGER written_learning_rounds_updated_at BEFORE UPDATE ON written_learning_rounds FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE written_question_coverage (
    user_id uuid NOT NULL, qualification_path_id uuid NOT NULL, question_id uuid NOT NULL, question_revision_id uuid NOT NULL,
    round_number integer NOT NULL CHECK (round_number > 0),
    covered_at timestamptz(3) NOT NULL DEFAULT now(), PRIMARY KEY (user_id, qualification_path_id, question_id),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (qualification_path_id, question_id) REFERENCES path_questions(qualification_path_id, question_id),
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER written_question_coverage_updated_at BEFORE UPDATE ON written_question_coverage FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  // Regular study covers one document; a review session covers one document or, without one, the whole path.
  yield* sql`CREATE TABLE written_study_sessions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    kind text NOT NULL CHECK (kind IN ('study','review')),
    document_id uuid CHECK (kind='review' OR document_id IS NOT NULL),
    user_exam_goal_version integer NOT NULL,
    question_count integer NOT NULL CHECK (question_count > 0),
    current_position integer NOT NULL DEFAULT 1 CHECK (current_position BETWEEN 1 AND question_count),
    ended_at timestamptz(3),
    last_activity_at timestamptz(3) NOT NULL DEFAULT now(),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, qualification_path_id, user_exam_goal_version) REFERENCES user_exam_goals(user_id, qualification_path_id, version) ON DELETE CASCADE,
    FOREIGN KEY (qualification_path_id, document_id) REFERENCES path_documents(qualification_path_id, document_id),
    UNIQUE (id, user_id, qualification_path_id, user_exam_goal_version)
  )`
  yield* sql`CREATE TRIGGER written_study_sessions_updated_at BEFORE UPDATE ON written_study_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  // At most one unfinished session per user, path, kind and scope (ADR-0002, ADR-0005); a review
  // session of the whole path has no document, which counts as one scope.
  yield* sql`CREATE UNIQUE INDEX written_study_sessions_one_unfinished ON written_study_sessions (user_id, qualification_path_id, kind, document_id) NULLS NOT DISTINCT WHERE ended_at IS NULL`
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
  // Immutable raw evidence of written learning (LearningEvent), the input for SRS, goals and XP.
  // The study kind is implied by the table (ADR-0005); the source answer is unique, so a retry never duplicates it.
  // `answered_at` is backend time, which decides the study day; review states are recomputable from these rows.
  yield* sql`CREATE TABLE written_learning_events (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    user_exam_goal_version integer NOT NULL,
    question_id uuid NOT NULL,
    question_revision_id uuid NOT NULL,
    mode text NOT NULL CHECK (mode IN ('study','review','favourites')),
    is_correct boolean NOT NULL,
    assistance text NOT NULL CHECK (assistance IN ('none','note','explanation')),
    answered_at timestamptz(3) NOT NULL,
    study_session_id uuid NOT NULL,
    position integer NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    UNIQUE (study_session_id, position),
    FOREIGN KEY (study_session_id, position) REFERENCES written_study_answers(study_session_id, position) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id, user_id, qualification_path_id, user_exam_goal_version) REFERENCES written_study_sessions(id, user_id, qualification_path_id, user_exam_goal_version) ON DELETE CASCADE,
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id)
  )`
  yield* sql`CREATE INDEX written_learning_events_question_time ON written_learning_events (user_id, qualification_path_id, question_id, answered_at)`
  // UserReviewState: the FSRS card of a written question per user and path (ADR-0005), produced by
  // `learning_event_id` under `rules_version`. It belongs to the substantive content it was built
  // on; once the question's current revision carries other substantive content, it reads as a new
  // card on every path, while the earlier events stay.
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
