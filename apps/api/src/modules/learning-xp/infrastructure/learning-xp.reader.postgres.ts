import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { XpReadError } from '../application/errors.js'
import { XpReader } from '../application/learning-xp.reader.js'

const TotalRow = Schema.Struct({ total: LearningXp })

export const XpReaderLive = Layer.effect(
  XpReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return XpReader.of({
      periodTotal: Effect.fn('XpReader.periodTotal')(
        function* (userId, period) {
          const rows =
            yield* sql`SELECT total FROM user_period_xp WHERE user_id=${userId} AND period_kind=${period.kind} AND period_key=${period.key} LIMIT 1`

          const [row] = yield* Schema.decodeUnknownEffect(Schema.Array(TotalRow))(rows)

          return row?.total ?? LearningXp.make(0)
        },
        Effect.mapError(cause => new XpReadError({ cause })),
      ),
    })
  }),
)
