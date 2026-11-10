import { DateTime, Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'
import { ExamCalendarWriteError } from '~api/modules/exam-calendar/errors.js'

import { ExamCalendarRepository } from './exam-calendar.repository.js'

export const ExamCalendarRepositoryLive = Layer.effect(
  ExamCalendarRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return ExamCalendarRepository.of({
      create: session => {
        const writtenAt = DateTime.formatIso(session.writtenAt)
        const oralPlanningAt = DateTime.formatIso(session.oralPlanningAt)
        const selectionClosesAt = DateTime.formatIso(session.selectionClosesAt)

        return sql`INSERT INTO exam_sessions (id,general_chamber_id,name,written_at,oral_planning_at,selection_closes_at,published) VALUES (${session.id},${session.generalChamberId},${session.name},${writtenAt},${oralPlanningAt},${selectionClosesAt},true)`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new ExamCalendarWriteError({ cause })),
        )
      },
      closeSelection: (id, at) => {
        const selectionClosesAt = DateTime.formatIso(at)

        return sql`UPDATE exam_sessions SET selection_closes_at=${selectionClosesAt} WHERE id=${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new ExamCalendarWriteError({ cause })),
        )
      },

      lock: id =>
        sql`SELECT id FROM exam_sessions WHERE id=${id} LIMIT 1 FOR SHARE`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new ExamCalendarWriteError({ cause })),
        ),
    })
  }),
)
