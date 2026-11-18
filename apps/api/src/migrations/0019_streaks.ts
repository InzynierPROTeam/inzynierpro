import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`CREATE TABLE daily_learning_activity (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_day timestamptz(3) NOT NULL,
    answer_count integer NOT NULL CHECK (answer_count > 0),
    qualified_at timestamptz(3),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, study_day)
  )`
  yield* sql`CREATE TRIGGER daily_learning_activity_updated_at BEFORE UPDATE ON daily_learning_activity FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE TABLE learning_streaks (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak integer NOT NULL CHECK (current_streak > 0),
    longest_streak integer NOT NULL CHECK (longest_streak >= current_streak),
    last_qualifying_day timestamptz(3) NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER learning_streaks_updated_at BEFORE UPDATE ON learning_streaks FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
