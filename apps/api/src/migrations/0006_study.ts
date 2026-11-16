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
  yield* sql`CREATE TABLE written_study_sessions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    kind text NOT NULL CHECK (kind IN ('study','review','favourites')),
    document_id uuid CHECK (kind<>'study' OR document_id IS NOT NULL),
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
  yield* sql`CREATE UNIQUE INDEX written_study_sessions_one_unfinished ON written_study_sessions (user_id, qualification_path_id, kind, document_id) NULLS NOT DISTINCT WHERE ended_at IS NULL`
  yield* sql`CREATE INDEX written_study_sessions_last_activity ON written_study_sessions (user_id, qualification_path_id, last_activity_at DESC, id DESC)`
  yield* sql`CREATE TABLE written_study_session_questions (
    study_session_id uuid NOT NULL REFERENCES written_study_sessions(id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position > 0),
    question_id uuid NOT NULL,
    question_revision_id uuid NOT NULL,
    explanation_opened_at timestamptz(3),
    note_opened_at timestamptz(3),
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
  yield* sql`CREATE TABLE written_favorite_questions (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES written_questions(id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, question_id)
  )`
  yield* sql`CREATE TABLE written_question_notes (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES written_questions(id),
    question_revision_id uuid NOT NULL,
    body text NOT NULL CHECK (char_length(body) <= 2000 AND body ~ '[^[:space:]]'),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, question_id),
    FOREIGN KEY (question_id, question_revision_id) REFERENCES question_revisions(question_id, id)
  )`
  yield* sql`CREATE TRIGGER written_question_notes_updated_at BEFORE UPDATE ON written_question_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
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
  yield* sql`CREATE TABLE oral_learning_events (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    user_exam_goal_version integer NOT NULL,
    question_id uuid NOT NULL,
    oral_revision_id uuid NOT NULL,
    mode text NOT NULL CHECK (mode IN ('study','review','favourites')),
    self_assessment text NOT NULL CHECK (self_assessment IN ('hard','medium','easy')),
    answered_at timestamptz(3) NOT NULL,
    study_session_id uuid NOT NULL,
    position integer NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    UNIQUE (study_session_id, position),
    FOREIGN KEY (study_session_id, position) REFERENCES oral_study_self_assessments(study_session_id, position) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id, user_id, qualification_path_id, user_exam_goal_version) REFERENCES oral_study_sessions(id, user_id, qualification_path_id, user_exam_goal_version) ON DELETE CASCADE,
    FOREIGN KEY (question_id, oral_revision_id) REFERENCES oral_revisions(question_id, id)
  )`
  yield* sql`CREATE INDEX oral_learning_events_question_time ON oral_learning_events (user_id, qualification_path_id, question_id, answered_at)`
  yield* sql`CREATE TABLE oral_session_quizzes (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    study_session_id uuid NOT NULL UNIQUE REFERENCES oral_study_sessions(id) ON DELETE CASCADE,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    UNIQUE (id, study_session_id)
  )`
  yield* sql`CREATE TABLE oral_session_quiz_checks (
    quiz_id uuid NOT NULL,
    position integer NOT NULL CHECK (position > 0),
    study_session_id uuid NOT NULL,
    session_position integer NOT NULL,
    oral_revision_id uuid NOT NULL,
    knowledge_check_revision_id uuid NOT NULL REFERENCES oral_knowledge_check_revisions(id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (quiz_id, position),
    UNIQUE (quiz_id, knowledge_check_revision_id),
    UNIQUE (quiz_id, position, knowledge_check_revision_id),
    FOREIGN KEY (quiz_id, study_session_id) REFERENCES oral_session_quizzes(id, study_session_id) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id, session_position, oral_revision_id) REFERENCES oral_study_session_questions(study_session_id, position, oral_revision_id) ON DELETE CASCADE
  )`
  yield* sql`CREATE TABLE oral_session_quiz_options (
    quiz_id uuid NOT NULL,
    position integer NOT NULL,
    knowledge_check_revision_id uuid NOT NULL,
    option_position smallint NOT NULL CHECK (option_position > 0),
    option_id uuid NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (quiz_id, position, option_position),
    UNIQUE (quiz_id, position, option_id),
    FOREIGN KEY (quiz_id, position, knowledge_check_revision_id) REFERENCES oral_session_quiz_checks(quiz_id, position, knowledge_check_revision_id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_check_revision_id, option_id) REFERENCES oral_knowledge_check_options(knowledge_check_revision_id, id)
  )`
  yield* sql`CREATE TABLE oral_session_quiz_answers (
    quiz_id uuid NOT NULL,
    position integer NOT NULL,
    is_correct boolean NOT NULL,
    answered_at timestamptz(3) NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (quiz_id, position),
    FOREIGN KEY (quiz_id, position) REFERENCES oral_session_quiz_checks(quiz_id, position) ON DELETE CASCADE
  )`
  yield* sql`CREATE TABLE oral_session_quiz_answer_options (
    quiz_id uuid NOT NULL,
    position integer NOT NULL,
    option_id uuid NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (quiz_id, position, option_id),
    FOREIGN KEY (quiz_id, position) REFERENCES oral_session_quiz_answers(quiz_id, position) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id, position, option_id) REFERENCES oral_session_quiz_options(quiz_id, position, option_id) ON DELETE CASCADE
  )`
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
