import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { BridgeCount, DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StreakReadError } from '~api/modules/streak/application/errors.js'
import { StreakReader } from '~api/modules/streak/application/streak.reader.js'
import { missedDayBridge, StreakRecord } from '~api/modules/streak/domain/streak.model.js'

const AnswerCountRow = Schema.Struct({ answerCount: DailyAnswerCount })

const StudyDayRow = Schema.Struct({ studyDay: DateTimeUtc })

const BridgeCountRow = Schema.Struct({ bridgeCount: BridgeCount })

export const StreakReaderLive = Layer.effect(
  StreakReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return StreakReader.of({
      streak: Effect.fn('StreakReader.streak')(
        function* (userId) {
          const rows =
            yield* sql`SELECT current_streak,longest_streak,last_qualifying_day FROM learning_streaks WHERE user_id=${userId} LIMIT 1`

          return Option.fromNullishOr(
            (yield* Schema.decodeUnknownEffect(Schema.Array(StreakRecord))(rows))[0],
          )
        },
        Effect.mapError(cause => new StreakReadError({ cause })),
      ),
      dailyAnswerCount: Effect.fn('StreakReader.dailyAnswerCount')(
        function* (userId, studyDay) {
          const rows =
            yield* sql`SELECT answer_count FROM daily_learning_activity WHERE user_id=${userId} AND study_day=${DateTime.formatIso(studyDay)} LIMIT 1`

          const [row] = yield* Schema.decodeUnknownEffect(Schema.Array(AnswerCountRow))(rows)

          return row?.answerCount ?? DailyAnswerCount.make(0)
        },
        Effect.mapError(cause => new StreakReadError({ cause })),
      ),
      qualifyingDays: Effect.fn('StreakReader.qualifyingDays')(
        function* (userId) {
          const rows =
            yield* sql`SELECT study_day FROM daily_learning_activity WHERE user_id=${userId} AND qualified_at IS NOT NULL ORDER BY study_day`

          const days = yield* Schema.decodeUnknownEffect(Schema.Array(StudyDayRow))(rows)

          return days.map(({ studyDay }) => studyDay)
        },
        Effect.mapError(cause => new StreakReadError({ cause })),
      ),
      bridgedDays: Effect.fn('StreakReader.bridgedDays')(
        function* (userId) {
          const rows =
            yield* sql`SELECT study_day FROM streak_bridge_events WHERE user_id=${userId} AND reason=${missedDayBridge} ORDER BY study_day`

          const days = yield* Schema.decodeUnknownEffect(Schema.Array(StudyDayRow))(rows)

          return days.map(({ studyDay }) => studyDay)
        },
        Effect.mapError(cause => new StreakReadError({ cause })),
      ),
      bridgeCount: Effect.fn('StreakReader.bridgeCount')(
        function* (userId) {
          const rows =
            yield* sql`SELECT bridge_count FROM streak_bridge_balances WHERE user_id=${userId} LIMIT 1`

          const [row] = yield* Schema.decodeUnknownEffect(Schema.Array(BridgeCountRow))(rows)

          return row?.bridgeCount ?? BridgeCount.make(0)
        },
        Effect.mapError(cause => new StreakReadError({ cause })),
      ),
    })
  }),
)
