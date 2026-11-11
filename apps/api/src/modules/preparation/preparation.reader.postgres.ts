import { ApiDateTime } from '@inzpro/domain/common/date-time'
import { Uuid } from '@inzpro/domain/common/id'
import {
  decodeCursor,
  makeCursorPage,
  resolveCursorPagination,
} from '@inzpro/domain/common/pagination'
import { UserExamGoal } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { UserQualificationPath } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { Effect, Layer, Option, Schema, DateTime } from 'effect'
import { SqlClient } from 'effect/sql'

import { PreparationReadError } from './errors.js'
import { PreparationReader } from './preparation.reader.js'

const GoalRow = Schema.Struct({
  ...UserExamGoal.fields,
  writtenAt: Schema.Date,
  oralPlanningAt: Schema.Date,
  oralExamDate: Schema.NullOr(Schema.Date),
})

const AssignmentRow = Schema.Struct({
  id: UserQualificationPath.fields.id,
  name: UserQualificationPath.fields.name,
  ...GoalRow.fields,
  archivedAt: Schema.NullOr(Schema.Date),
})

const goalFromRow = (row: typeof GoalRow.Type) => ({
  version: row.version,
  examSessionId: row.examSessionId,
  sessionName: row.sessionName,
  accessScope: row.accessScope,
  writtenAt: Schema.decodeSync(ApiDateTime)(
    DateTime.formatIso(DateTime.fromDateUnsafe(row.writtenAt)),
  ),
  oralPlanningAt: Schema.decodeSync(ApiDateTime)(
    DateTime.formatIso(DateTime.fromDateUnsafe(row.oralPlanningAt)),
  ),
  oralExamDate: Option.map(Option.fromNullishOr(row.oralExamDate), date =>
    Schema.decodeSync(ApiDateTime)(DateTime.formatIso(DateTime.fromDateUnsafe(date))),
  ),
})

const assignmentFromRow = (row: typeof AssignmentRow.Type) => ({
  id: row.id,
  name: row.name,
  accessScope: row.accessScope,
  archived: row.archivedAt !== null,
  goal: goalFromRow(row),
})

export const PreparationReaderLive = Layer.effect(
  PreparationReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    // Reused SQL contains only column selection and joins; object assembly stays in TypeScript.
    const assignmentColumns = sql`p.id,p.name,up.access_scope,up.archived_at,g.version,g.exam_session_id,e.name AS session_name,e.written_at,e.oral_planning_at,g.oral_exam_date`
    const assignmentTables = sql`FROM user_qualification_paths up JOIN qualification_paths p ON p.id=up.qualification_path_id JOIN user_exam_goals g ON g.user_id=up.user_id AND g.qualification_path_id=p.id JOIN exam_sessions e ON e.id=g.exam_session_id`
    const latestGoal = sql`g.version=(SELECT max(h.version) FROM user_exam_goals h WHERE h.user_id=up.user_id AND h.qualification_path_id=p.id)`

    return PreparationReader.of({
      paths: Effect.fn('PreparationReader.paths')(
        function* (userId, req) {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(Uuid, req.cursor)

          const afterCursor = cursor === undefined ? sql`true` : sql`p.id > ${cursor}`

          const rows =
            yield* sql`SELECT ${assignmentColumns} ${assignmentTables} WHERE up.user_id=${userId} AND ${latestGoal} AND ${afterCursor} ORDER BY p.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(AssignmentRow))(rows)

          return makeCursorPage(data.map(assignmentFromRow), limit, row => row.id)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new PreparationReadError({ cause })),
          SchemaError: cause => Effect.fail(new PreparationReadError({ cause })),
        }),
      ),
      path: Effect.fn('PreparationReader.path')(
        function* (userId, pathId) {
          const rows =
            yield* sql`SELECT ${assignmentColumns} ${assignmentTables} WHERE up.user_id=${userId} AND p.id=${pathId} AND ${latestGoal} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(AssignmentRow))(rows)

          return Option.map(Option.fromNullishOr(data[0]), assignmentFromRow)
        },
        Effect.mapError(cause => new PreparationReadError({ cause })),
      ),
      selectedPath: Effect.fn('PreparationReader.selectedPath')(
        function* (userId) {
          const rows =
            yield* sql`SELECT ${assignmentColumns} ${assignmentTables} JOIN user_path_selections s ON s.user_id=up.user_id AND s.qualification_path_id=p.id WHERE up.user_id=${userId} AND up.archived_at IS NULL AND ${latestGoal} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(AssignmentRow))(rows)

          return Option.map(Option.fromNullishOr(data[0]), assignmentFromRow)
        },
        Effect.mapError(cause => new PreparationReadError({ cause })),
      ),
      goals: Effect.fn('PreparationReader.goals')(
        function* (userId, pathId, req) {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1

          const cursor = yield* decodeCursor(
            Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThan(0)),
            req.cursor,
          )

          const afterCursor = cursor === undefined ? sql`true` : sql`g.version < ${cursor}`

          const rows =
            yield* sql`SELECT g.version,g.exam_session_id,g.access_scope,e.name AS session_name,e.written_at,e.oral_planning_at,g.oral_exam_date FROM user_exam_goals g JOIN exam_sessions e ON e.id=g.exam_session_id WHERE g.user_id=${userId} AND g.qualification_path_id=${pathId} AND ${afterCursor} ORDER BY g.version DESC LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(GoalRow))(rows)

          return makeCursorPage(data.map(goalFromRow), limit, row => String(row.version))
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new PreparationReadError({ cause })),
          SchemaError: cause => Effect.fail(new PreparationReadError({ cause })),
        }),
      ),
    })
  }),
)
