import { rankingSize } from '@inzpro/domain/modules/rankings/ranking'
import { Array as Arr, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { RankingReadError } from '../application/errors.js'
import { RankingReader } from '../application/ranking.reader.js'
import { RankedUser } from '../domain/ranking.model.js'

export const RankingReaderLive = Layer.effect(
  RankingReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return RankingReader.of({
      top: Effect.fn('RankingReader.top')(
        function* (period) {
          const rows =
            yield* sql`SELECT (row_number() OVER (ORDER BY x.total DESC,x.reached_at,x.user_id))::integer AS position,x.user_id,u.name,u.image,u.private_profile,x.total AS xp
 FROM user_period_xp x JOIN users u ON u.id=x.user_id
 WHERE x.period_kind=${period.kind} AND x.period_key=${period.key}
 ORDER BY x.total DESC,x.reached_at,x.user_id LIMIT ${rankingSize}`

          return yield* Schema.decodeUnknownEffect(Schema.Array(RankedUser))(rows)
        },
        Effect.mapError(cause => new RankingReadError({ cause })),
      ),
      rankedUser: Effect.fn('RankingReader.rankedUser')(
        function* (userId, period) {
          const rows =
            yield* sql`SELECT (SELECT count(*) FROM user_period_xp o WHERE o.period_kind=x.period_kind AND o.period_key=x.period_key
   AND (o.total>x.total OR (o.total=x.total AND (o.reached_at,o.user_id)<(x.reached_at,x.user_id))))::integer+1 AS position,
 x.user_id,u.name,u.image,u.private_profile,x.total AS xp
 FROM user_period_xp x JOIN users u ON u.id=x.user_id
 WHERE x.user_id=${userId} AND x.period_kind=${period.kind} AND x.period_key=${period.key} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(RankedUser))(rows)

          return Arr.head(data)
        },
        Effect.mapError(cause => new RankingReadError({ cause })),
      ),
    })
  }),
)
