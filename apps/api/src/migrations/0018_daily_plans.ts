import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`CREATE TABLE written_daily_plans (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    study_day timestamptz(3) NOT NULL,
    round_number integer NOT NULL CHECK (round_number > 0),
    target_date timestamptz(3) NOT NULL CHECK (target_date >= study_day),
    remaining_question_count integer NOT NULL CHECK (remaining_question_count >= 0),
    target_question_count integer NOT NULL CHECK (target_question_count >= 0),
    completed_question_count integer NOT NULL DEFAULT 0 CHECK (completed_question_count >= 0),
    plan_settings_version integer NOT NULL CHECK (plan_settings_version > 0),
    round_completed_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id, study_day),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE
  )`
  yield* sql`CREATE INDEX written_daily_plans_round ON written_daily_plans (user_id, qualification_path_id, round_number, study_day)`
  yield* sql`CREATE TRIGGER written_daily_plans_updated_at BEFORE UPDATE ON written_daily_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE written_daily_plan_settings (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    version integer NOT NULL CHECK (version > 1),
    mode text NOT NULL CHECK (mode IN ('default', 'target_date', 'daily_count')),
    target_date timestamptz(3),
    daily_question_count integer CHECK (daily_question_count > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id, version),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    CHECK ((mode = 'target_date') = (target_date IS NOT NULL)),
    CHECK ((mode = 'daily_count') = (daily_question_count IS NOT NULL))
  )`

  yield* sql`CREATE TABLE oral_daily_plans (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    study_day timestamptz(3) NOT NULL,
    round_number integer NOT NULL CHECK (round_number > 0),
    target_date timestamptz(3) NOT NULL CHECK (target_date >= study_day),
    remaining_question_count integer NOT NULL CHECK (remaining_question_count >= 0),
    target_question_count integer NOT NULL CHECK (target_question_count >= 0),
    completed_question_count integer NOT NULL DEFAULT 0 CHECK (completed_question_count >= 0),
    plan_settings_version integer NOT NULL CHECK (plan_settings_version > 0),
    round_completed_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id, study_day),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE
  )`
  yield* sql`CREATE INDEX oral_daily_plans_round ON oral_daily_plans (user_id, qualification_path_id, round_number, study_day)`
  yield* sql`CREATE TRIGGER oral_daily_plans_updated_at BEFORE UPDATE ON oral_daily_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE oral_daily_plan_settings (
    user_id uuid NOT NULL,
    qualification_path_id uuid NOT NULL,
    version integer NOT NULL CHECK (version > 1),
    mode text NOT NULL CHECK (mode IN ('default', 'target_date', 'daily_count')),
    target_date timestamptz(3),
    daily_question_count integer CHECK (daily_question_count > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, qualification_path_id, version),
    FOREIGN KEY (user_id, qualification_path_id) REFERENCES user_qualification_paths(user_id, qualification_path_id) ON DELETE CASCADE,
    CHECK ((mode = 'target_date') = (target_date IS NOT NULL)),
    CHECK ((mode = 'daily_count') = (daily_question_count IS NOT NULL))
  )`
})
