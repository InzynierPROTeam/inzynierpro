import { Uuid } from '@inzpro/domain/common/id'
import {
  decodeCursor,
  resolveCursorPagination,
  makeCursorPage,
} from '@inzpro/domain/common/pagination'
import { ExamSessionOption } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { ExamCalendarReadError } from './errors.js'
import { ExamCalendarReader } from './exam-calendar.reader.js'

export const ExamCalendarReaderLive = Layer.effect(
  ExamCalendarReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return ExamCalendarReader.of({
      sessions: (specializationId, req) =>
        Effect.gen(function* () {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(Uuid, req.cursor)

          const afterCursor = cursor === undefined ? sql`true` : sql`e.id > ${cursor}`

          const rows =
            yield* sql`SELECT e.id,e.name FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id WHERE s.id=${specializationId} AND e.published AND e.selection_closes_at>clock_timestamp() AND ${afterCursor} ORDER BY e.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(ExamSessionOption))(rows)

          return makeCursorPage(data, limit, row => row.id)
        }).pipe(
          Effect.catchTags({
            SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
            SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          }),
        ),
      sessionsForPath: (pathId, req) =>
        Effect.gen(function* () {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(Uuid, req.cursor)

          const afterCursor = cursor === undefined ? sql`true` : sql`e.id > ${cursor}`

          const rows =
            yield* sql`SELECT e.id,e.name FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} AND e.published AND e.selection_closes_at>clock_timestamp() AND ${afterCursor} ORDER BY e.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(ExamSessionOption))(rows)

          return makeCursorPage(data, limit, row => row.id)
        }).pipe(
          Effect.catchTags({
            SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
            SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          }),
        ),
      isEligible: (pathId, sessionId) =>
        sql`SELECT e.id FROM exam_sessions e JOIN specializations s ON s.general_chamber_id=e.general_chamber_id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} AND e.id=${sessionId} AND e.published AND e.selection_closes_at>clock_timestamp() LIMIT 1`.pipe(
          Effect.map(rows => rows.length > 0),
          Effect.mapError(cause => new ExamCalendarReadError({ cause })),
        ),
    })
  }),
)
