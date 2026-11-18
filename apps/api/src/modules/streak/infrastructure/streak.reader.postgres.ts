import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StreakReadError } from '~api/modules/streak/application/errors.js'
import { StreakReader } from '~api/modules/streak/application/streak.reader.js'
import { StreakRecord } from '~api/modules/streak/domain/streak.model.js'

const AnswerCountRow = Schema.Struct({ answerCount: DailyAnswerCount })

const QualifyingDayRow = Schema.Struct({ studyDay: DateTimeUtc })

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

          const days = yield* Schema.decodeUnknownEffect(Schema.Array(QualifyingDayRow))(rows)

          return days.map(({ studyDay }) => studyDay)
        },
        Effect.mapError(cause => new StreakReadError({ cause })),
      ),
    })
  }),
)
