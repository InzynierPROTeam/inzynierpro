import { DateTime, Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'

import { XpWriteError } from '../application/errors.js'
import { XpRepository } from '../application/learning-xp.repository.js'
import { xpStudyDate } from '../domain/learning-xp.rules.js'

export const XpRepositoryLive = Layer.effect(
  XpRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return XpRepository.of({
      recordAward: Effect.fn('XpRepository.recordAward')(
        function* (award, dailyLimit) {
          const awardedAt = DateTime.formatIso(award.awardedAt)
          const studyDate = xpStudyDate(award.awardedAt)
          const limit = dailyLimit ?? null

          const rows =
            yield* sql`INSERT INTO xp_events (user_id, amount, reason, award_key, awarded_at, qualification_path_id, exam_session_id)
      SELECT ${award.userId}, ${award.amount}, ${award.reason}, ${award.awardKey}, ${awardedAt}, ${award.pathId}, ${award.examSessionId}
      WHERE ${limit}::integer IS NULL OR (SELECT count(*) FROM xp_events WHERE user_id=${award.userId} AND reason=${award.reason} AND awarded_at>=(${studyDate}::date::timestamp AT TIME ZONE 'Europe/Warsaw') AND awarded_at<((${studyDate}::date+1)::timestamp AT TIME ZONE 'Europe/Warsaw'))<${limit}
      ON CONFLICT (user_id, award_key) DO NOTHING RETURNING award_key`

          return rows.length > 0
        },
        Effect.mapError(cause => new XpWriteError({ cause })),
      ),
      addPeriodXp: Effect.fn('XpRepository.addPeriodXp')(
        function* (award, period, reachedAt) {
          const reached = DateTime.formatIso(reachedAt)
          yield* sql`INSERT INTO user_period_xp (user_id, period_kind, period_key, total, reached_at)
      VALUES (${award.userId}, ${period.kind}, ${period.key}, ${award.amount}, ${reached})
      ON CONFLICT (user_id, period_kind, period_key) DO UPDATE SET total=user_period_xp.total+EXCLUDED.total, reached_at=greatest(user_period_xp.reached_at,EXCLUDED.reached_at)`
        },
        Effect.mapError(cause => new XpWriteError({ cause })),
      ),
    })
  }),
)
