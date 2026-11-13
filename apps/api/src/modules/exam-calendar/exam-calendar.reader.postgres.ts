import { DateTimeUtc, dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  decodeCursor,
  resolveCursorPagination,
  makeCursorPage,
} from '@inzpro/domain/common/pagination'
import { ExamSessionId, ExamSessionOption } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { DateTime, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { ExamCalendarReadError } from './errors.js'
import { ExamCalendarReader } from './exam-calendar.reader.js'

const SessionRow = Schema.Struct({ ...ExamSessionOption.fields, writtenAt: DateTimeUtc })

const SessionCursor = Schema.fromJsonString(Schema.Struct({ at: DateTimeUtc, id: ExamSessionId }))

export const ExamCalendarReaderLive = Layer.effect(
  ExamCalendarReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return ExamCalendarReader.of({
      sessions: Effect.fn('ExamCalendarReader.sessions')(
        function* (specializationId, req) {
          const now = DateTime.formatIso(yield* DateTime.now)
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(SessionCursor, req.cursor)

          const afterCursor =
            cursor === undefined
              ? sql`true`
              : sql`(e.written_at,e.id) > (${DateTime.formatIso(cursor.at)},${cursor.id})`

          const rows =
            yield* sql`SELECT e.id,e.name,e.written_at,e.is_confirmed FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id WHERE s.id=${specializationId} AND e.published AND e.selection_closes_at>${now} AND ${afterCursor} ORDER BY e.written_at,e.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(SessionRow))(rows)

          const page = makeCursorPage(data, limit, row =>
            Schema.encodeSync(SessionCursor)({ at: row.writtenAt, id: row.id }),
          )

          return {
            ...page,
            data: page.data.map(row => ({
              ...row,
              writtenAt: dateTimeUtcToUtcIsoDateTime(row.writtenAt),
            })),
          }
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
        }),
      ),
      sessionsForPath: Effect.fn('ExamCalendarReader.sessionsForPath')(
        function* (pathId, req) {
          const now = DateTime.formatIso(yield* DateTime.now)
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(SessionCursor, req.cursor)

          const afterCursor =
            cursor === undefined
              ? sql`true`
              : sql`(e.written_at,e.id) > (${DateTime.formatIso(cursor.at)},${cursor.id})`

          const rows =
            yield* sql`SELECT e.id,e.name,e.written_at,e.is_confirmed FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} AND e.published AND e.selection_closes_at>${now} AND ${afterCursor} ORDER BY e.written_at,e.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(SessionRow))(rows)

          const page = makeCursorPage(data, limit, row =>
            Schema.encodeSync(SessionCursor)({ at: row.writtenAt, id: row.id }),
          )

          return {
            ...page,
            data: page.data.map(row => ({
              ...row,
              writtenAt: dateTimeUtcToUtcIsoDateTime(row.writtenAt),
            })),
          }
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
