import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`CREATE TABLE written_question_statistics (
    question_revision_id uuid NOT NULL REFERENCES question_revisions(id),
    mode text NOT NULL CHECK (mode IN ('study','review','favourites','exam')),
    assistance text NOT NULL CHECK (assistance IN ('none','note','explanation')),
    study_day timestamptz(3) NOT NULL,
    answer_count integer NOT NULL CHECK (answer_count > 0),
    correct_count integer NOT NULL CHECK (correct_count BETWEEN 0 AND answer_count),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (question_revision_id, mode, assistance, study_day)
  )`
  yield* sql`CREATE TRIGGER written_question_statistics_updated_at BEFORE UPDATE ON written_question_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE written_answer_option_statistics (
    question_revision_id uuid NOT NULL,
    question_answer_id uuid NOT NULL,
    mode text NOT NULL CHECK (mode IN ('study','review','favourites','exam')),
    assistance text NOT NULL CHECK (assistance IN ('none','note','explanation')),
    study_day timestamptz(3) NOT NULL,
    selection_count integer NOT NULL CHECK (selection_count > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (question_revision_id, mode, assistance, study_day, question_answer_id),
    FOREIGN KEY (question_revision_id, question_answer_id) REFERENCES question_answers(question_revision_id, id)
  )`
  yield* sql`CREATE TRIGGER written_answer_option_statistics_updated_at BEFORE UPDATE ON written_answer_option_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE oral_self_assessment_statistics (
    oral_revision_id uuid NOT NULL REFERENCES oral_revisions(id),
    study_day timestamptz(3) NOT NULL,
    self_assessment text NOT NULL CHECK (self_assessment IN ('hard','medium','easy')),
    assessment_count integer NOT NULL CHECK (assessment_count > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (oral_revision_id, study_day, self_assessment)
  )`
  yield* sql`CREATE TRIGGER oral_self_assessment_statistics_updated_at BEFORE UPDATE ON oral_self_assessment_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE oral_knowledge_check_statistics (
    knowledge_check_revision_id uuid NOT NULL REFERENCES oral_knowledge_check_revisions(id),
    study_day timestamptz(3) NOT NULL,
    answer_count integer NOT NULL CHECK (answer_count > 0),
    correct_count integer NOT NULL CHECK (correct_count BETWEEN 0 AND answer_count),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (knowledge_check_revision_id, study_day)
  )`
  yield* sql`CREATE TRIGGER oral_knowledge_check_statistics_updated_at BEFORE UPDATE ON oral_knowledge_check_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE mock_exam_statistics (
    blueprint_id uuid NOT NULL,
    blueprint_version integer NOT NULL,
    study_day timestamptz(3) NOT NULL,
    finished_count integer NOT NULL CHECK (finished_count > 0),
    passed_count integer NOT NULL CHECK (passed_count BETWEEN 0 AND finished_count),
    active_seconds integer NOT NULL CHECK (active_seconds >= 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (blueprint_id, blueprint_version, study_day),
    FOREIGN KEY (blueprint_id, blueprint_version) REFERENCES exam_blueprint_versions(blueprint_id, version)
  )`
  yield* sql`CREATE TRIGGER mock_exam_statistics_updated_at BEFORE UPDATE ON mock_exam_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE mock_exam_score_statistics (
    blueprint_id uuid NOT NULL,
    blueprint_version integer NOT NULL,
    study_day timestamptz(3) NOT NULL,
    percent smallint NOT NULL CHECK (percent BETWEEN 0 AND 100),
    attempt_count integer NOT NULL CHECK (attempt_count > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (blueprint_id, blueprint_version, study_day, percent),
    FOREIGN KEY (blueprint_id, blueprint_version) REFERENCES exam_blueprint_versions(blueprint_id, version)
  )`
  yield* sql`CREATE TRIGGER mock_exam_score_statistics_updated_at BEFORE UPDATE ON mock_exam_score_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
