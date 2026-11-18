import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE xp_events (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    award_key text NOT NULL,
    amount integer NOT NULL CHECK (amount > 0),
    reason text NOT NULL,
    awarded_at timestamptz(3) NOT NULL,
    qualification_path_id uuid NOT NULL REFERENCES qualification_paths(id),
    exam_session_id uuid NOT NULL REFERENCES exam_sessions(id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, award_key)
  )`
  yield* sql`CREATE INDEX xp_events_user_awarded_at ON xp_events (user_id, awarded_at)`
  yield* sql`CREATE TABLE user_period_xp (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_kind text NOT NULL CHECK (period_kind IN ('week', 'month', 'exam_session', 'all_time')),
    period_key text NOT NULL,
    total integer NOT NULL CHECK (total > 0),
    reached_at timestamptz(3) NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, period_kind, period_key)
  )`
  yield* sql`CREATE INDEX user_period_xp_ranking ON user_period_xp (period_kind, period_key, total DESC, reached_at, user_id)`
  yield* sql`CREATE TRIGGER user_period_xp_updated_at BEFORE UPDATE ON user_period_xp FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
