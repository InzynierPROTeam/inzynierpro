import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`CREATE TABLE streak_bridge_events (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key text NOT NULL,
    reason text NOT NULL CHECK (reason IN ('streak_milestone', 'passed_mock_exam', 'completed_round', 'missed_day')),
    study_day timestamptz(3) NOT NULL,
    bridge_change integer NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_key),
    CHECK ((reason = 'missed_day') = (bridge_change < 0))
  )`
  yield* sql`CREATE INDEX streak_bridge_events_missed_days ON streak_bridge_events (user_id, study_day) WHERE reason = 'missed_day'`

  yield* sql`CREATE TABLE streak_bridge_balances (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bridge_count integer NOT NULL CHECK (bridge_count >= 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER streak_bridge_balances_updated_at BEFORE UPDATE ON streak_bridge_balances FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
