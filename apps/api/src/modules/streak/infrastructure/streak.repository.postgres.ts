import { DateTime, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StreakWriteError } from '~api/modules/streak/application/errors.js'
import { StreakRepository } from '~api/modules/streak/application/streak.repository.js'
import { DailyActivity } from '~api/modules/streak/domain/streak.model.js'

export const StreakRepositoryLive = Layer.effect(
  StreakRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return StreakRepository.of({
      addDailyAnswers: Effect.fn('StreakRepository.addDailyAnswers')(
        function* (userId, studyDay, answerCount) {
          const rows =
            yield* sql`INSERT INTO daily_learning_activity (user_id,study_day,answer_count) VALUES (${userId},${DateTime.formatIso(studyDay)},${answerCount})
 ON CONFLICT (user_id,study_day) DO UPDATE SET answer_count=daily_learning_activity.answer_count+EXCLUDED.answer_count
 RETURNING answer_count,qualified_at IS NOT NULL AS is_qualifying`

          const [activity] = yield* Schema.decodeUnknownEffect(Schema.Tuple([DailyActivity]))(rows)

          return activity
        },
        Effect.mapError(cause => new StreakWriteError({ cause })),
      ),
      markQualifyingDay: Effect.fn('StreakRepository.markQualifyingDay')(
        function* (userId, studyDay) {
          yield* sql`UPDATE daily_learning_activity SET qualified_at=coalesce(qualified_at,clock_timestamp())
 WHERE user_id=${userId} AND study_day=${DateTime.formatIso(studyDay)}`
        },
        Effect.mapError(cause => new StreakWriteError({ cause })),
      ),
      storeStreak: Effect.fn('StreakRepository.storeStreak')(
        function* (userId, record) {
          yield* sql`INSERT INTO learning_streaks (user_id,current_streak,longest_streak,last_qualifying_day)
 VALUES (${userId},${record.currentStreak},${record.longestStreak},${DateTime.formatIso(record.lastQualifyingDay)})
 ON CONFLICT (user_id) DO UPDATE SET current_streak=EXCLUDED.current_streak,longest_streak=EXCLUDED.longest_streak,last_qualifying_day=EXCLUDED.last_qualifying_day`
        },
        Effect.mapError(cause => new StreakWriteError({ cause })),
      ),
      recordBridgeEvent: Effect.fn('StreakRepository.recordBridgeEvent')(
        function* (userId, event) {
          const rows =
            yield* sql`INSERT INTO streak_bridge_events (user_id,event_key,reason,study_day,bridge_change)
 VALUES (${userId},${event.key},${event.reason},${DateTime.formatIso(event.studyDay)},${event.bridgeChange})
 ON CONFLICT (user_id,event_key) DO NOTHING RETURNING event_key`

          return rows.length > 0
        },
        Effect.mapError(cause => new StreakWriteError({ cause })),
      ),
      storeBridgeCount: Effect.fn('StreakRepository.storeBridgeCount')(
        function* (userId, bridgeCount) {
          yield* sql`INSERT INTO streak_bridge_balances (user_id,bridge_count) VALUES (${userId},${bridgeCount})
 ON CONFLICT (user_id) DO UPDATE SET bridge_count=EXCLUDED.bridge_count`
        },
        Effect.mapError(cause => new StreakWriteError({ cause })),
      ),
    })
  }),
)
