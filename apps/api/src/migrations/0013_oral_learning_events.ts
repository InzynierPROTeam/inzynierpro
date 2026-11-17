import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
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
})
