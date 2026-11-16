import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  DistrictChamberCode,
  DistrictChamberId,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { DateTime, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { ExamCalendarReadError } from '~api/modules/exam-calendar/application/errors.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'
import type { DistrictChamber } from '~api/modules/exam-calendar/domain/district-chamber.model.js'
import { ExamSessionOption } from '~api/modules/exam-calendar/domain/exam-session.model.js'

const DistrictChamberPageRow = Schema.Struct({
  id: DistrictChamberId,
  code: DistrictChamberCode,
  name: Schema.NonEmptyString,
  shortName: Schema.NonEmptyString,
  sortOrder: Schema.Int,
})

const toDistrictChamber = (row: typeof DistrictChamberPageRow.Type): DistrictChamber => ({
  id: row.id,
  code: row.code,
  name: row.name,
  shortName: row.shortName,
})

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

    const districtChambersPage = makeCursorPaginator(
      sql,
      Schema.Struct({ sortOrder: Schema.Int, id: DistrictChamberId }),
      [
        ['sortOrder', sql`d.sort_order`, 'asc'],
        ['id', sql`d.id`, 'asc'],
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
      districtChambers: Effect.fn('ExamCalendarReader.districtChambers')(
        function* (generalChamberId, req) {
          return yield* districtChambersPage(
            req,
            window =>
              sql`SELECT d.id,d.code,d.name,d.short_name,d.sort_order FROM district_chambers d WHERE d.general_chamber_id=${generalChamberId} AND d.published AND ${window.after} ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DistrictChamberPageRow))),
              ),
            row => ({ sortOrder: row.sortOrder, id: row.id }),
          )
        },
        Effect.map(page => mapCursorPage(page, toDistrictChamber)),
        Effect.catchTags({
          SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
        }),
      ),
      isDistrictChamberEligible: Effect.fn('ExamCalendarReader.isDistrictChamberEligible')(
        function* (pathId, districtChamberId) {
          return yield* sql`SELECT d.id FROM district_chambers d JOIN specializations s ON s.general_chamber_id=d.general_chamber_id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} AND d.id=${districtChamberId} AND d.published LIMIT 1`.pipe(
            Effect.map(rows => rows.length > 0),
            Effect.mapError(cause => new ExamCalendarReadError({ cause })),
          )
        },
      ),
    })
  }),
)
