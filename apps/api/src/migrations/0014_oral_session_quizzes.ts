import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
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
})
