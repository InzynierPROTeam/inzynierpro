import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { DateTime, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'
import { ExamCalendarReadError } from '~api/modules/exam-calendar/application/errors.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'
import { ExamSessionOption } from '~api/modules/exam-calendar/domain/exam-session.model.js'

export const ExamCalendarReaderLive = Layer.effect(
  ExamCalendarReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const sessionsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ writtenAt: DateTimeUtc, id: ExamSessionId }),
      [
        ['writtenAt', sql`e.written_at`, 'asc'],
        ['id', sql`e.id`, 'asc'],
      ],
    )

    return ExamCalendarReader.of({
      sessions: Effect.fn('ExamCalendarReader.sessions')(
        function* (specializationId, req) {
          const now = DateTime.formatIso(yield* DateTime.now)

          return yield* sessionsPage(
            req,
            window =>
              sql`SELECT e.id,e.name,e.written_at,e.is_confirmed FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id WHERE s.id=${specializationId} AND e.published AND e.selection_closes_at>${now} AND ${window.after} ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ExamSessionOption))),
              ),
            row => ({ writtenAt: row.writtenAt, id: row.id }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
        }),
      ),
      sessionsForPath: Effect.fn('ExamCalendarReader.sessionsForPath')(
        function* (pathId, req) {
          const now = DateTime.formatIso(yield* DateTime.now)

          return yield* sessionsPage(
            req,
            window =>
              sql`SELECT e.id,e.name,e.written_at,e.is_confirmed FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} AND e.published AND e.selection_closes_at>${now} AND ${window.after} ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ExamSessionOption))),
              ),
            row => ({ writtenAt: row.writtenAt, id: row.id }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
        }),
      ),
      isEligible: Effect.fn('ExamCalendarReader.isEligible')(function* (pathId, sessionId) {
        const now = DateTime.formatIso(yield* DateTime.now)

        return yield* sql`SELECT e.id FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} AND e.id=${sessionId} AND e.published AND e.selection_closes_at>${now} LIMIT 1`.pipe(
          Effect.map(rows => rows.length > 0),
          Effect.mapError(cause => new ExamCalendarReadError({ cause })),
        )
      }),
    })
  }),
)
