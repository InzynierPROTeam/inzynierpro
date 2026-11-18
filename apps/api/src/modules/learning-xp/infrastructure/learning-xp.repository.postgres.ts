import { DateTime, Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'

import { XpWriteError } from '../application/errors.js'
import { XpRepository } from '../application/learning-xp.repository.js'

export const XpRepositoryLive = Layer.effect(
  XpRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return XpRepository.of({
      recordAward: Effect.fn('XpRepository.recordAward')(
        function* (award) {
          const awardedAt = DateTime.formatIso(award.awardedAt)

          const rows =
            yield* sql`INSERT INTO xp_events (user_id, amount, reason, award_key, awarded_at, qualification_path_id, exam_session_id)
      VALUES (${award.userId}, ${award.amount}, 'written_answer', ${award.awardKey}, ${awardedAt}, ${award.pathId}, ${award.examSessionId})
      ON CONFLICT (user_id, award_key) DO NOTHING RETURNING award_key`

          return rows.length > 0
        },
        Effect.mapError(cause => new XpWriteError({ cause })),
      ),
      addPeriodXp: Effect.fn('XpRepository.addPeriodXp')(
        function* (award, period) {
          const awardedAt = DateTime.formatIso(award.awardedAt)
          yield* sql`INSERT INTO user_period_xp (user_id, period_kind, period_key, total, reached_at)
      VALUES (${award.userId}, ${period.kind}, ${period.key}, ${award.amount}, ${awardedAt})
      ON CONFLICT (user_id, period_kind, period_key) DO UPDATE SET total=user_period_xp.total+EXCLUDED.total, reached_at=EXCLUDED.reached_at`
        },
        Effect.mapError(cause => new XpWriteError({ cause })),
      ),
    })
  }),
)
