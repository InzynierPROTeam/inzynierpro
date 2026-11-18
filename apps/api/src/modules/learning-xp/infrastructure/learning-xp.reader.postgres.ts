import { Array as Arr, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { XpReadError } from '../application/errors.js'
import { XpReader } from '../application/learning-xp.reader.js'
import { XpPeriodTotal } from '../domain/learning-xp.model.js'

export const XpReaderLive = Layer.effect(
  XpReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return XpReader.of({
      periodTotal: Effect.fn('XpReader.periodTotal')(
        function* (userId, period) {
          const rows =
            yield* sql`SELECT total,reached_at FROM user_period_xp WHERE user_id=${userId} AND period_kind=${period.kind} AND period_key=${period.key} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(XpPeriodTotal))(rows)

          return Arr.head(data)
        },
        Effect.mapError(cause => new XpReadError({ cause })),
      ),
    })
  }),
)
