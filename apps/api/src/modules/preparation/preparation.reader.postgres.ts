import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  decodeCursor,
  makeCursorPage,
  resolveCursorPagination,
} from '@inzpro/domain/common/pagination'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Layer, Option, Schema, DateTime } from 'effect'
import { SqlClient } from 'effect/sql'

import { PreparationReadError } from './errors.js'
import { UserExamGoal, UserQualificationPath } from './preparation.model.js'
import { PreparationReader } from './preparation.reader.js'

const AssignmentRow = Schema.Struct({
  id: UserQualificationPath.fields.id,
  name: UserQualificationPath.fields.name,
  specializationId: UserQualificationPath.fields.specialization.fields.id,
  specializationName: UserQualificationPath.fields.specialization.fields.name,
  specializationDescription: UserQualificationPath.fields.specialization.fields.description,
  specializationCode: UserQualificationPath.fields.specialization.fields.code,
  qualificationKindId: UserQualificationPath.fields.qualificationKind.fields.id,
  qualificationKindName: UserQualificationPath.fields.qualificationKind.fields.name,
  qualificationKindCode: UserQualificationPath.fields.qualificationKind.fields.code,
  qualificationScopeId: UserQualificationPath.fields.qualificationScope.fields.id,
  qualificationScopeName: UserQualificationPath.fields.qualificationScope.fields.name,
  qualificationScopeCode: UserQualificationPath.fields.qualificationScope.fields.code,
  ...UserExamGoal.fields,
  archivedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

const AssignmentPageRow = Schema.Struct({ ...AssignmentRow.fields, updatedAt: DateTimeUtc })

const AssignmentCursor = Schema.fromJsonString(
  Schema.Struct({ at: DateTimeUtc, id: QualificationPathId }),
)

const goalFromRow = (row: UserExamGoal) => ({
  version: row.version,
  examSessionId: row.examSessionId,
  sessionName: row.sessionName,
  sessionIsConfirmed: row.sessionIsConfirmed,
  accessScope: row.accessScope,
  writtenAt: row.writtenAt,
  oralPlanningAt: row.oralPlanningAt,
  oralExamDate: row.oralExamDate,
})

const assignmentFromRow = (row: typeof AssignmentRow.Type) => ({
  id: row.id,
  name: row.name,
  specialization: {
    id: row.specializationId,
    name: row.specializationName,
    code: row.specializationCode,
    description: row.specializationDescription,
  },
  qualificationKind: {
    id: row.qualificationKindId,
    name: row.qualificationKindName,
    code: row.qualificationKindCode,
  },
  qualificationScope: {
    id: row.qualificationScopeId,
    name: row.qualificationScopeName,
    code: row.qualificationScopeCode,
  },
  accessScope: row.accessScope,
  archived: Option.isSome(row.archivedAt),
  goal: goalFromRow(row),
})

export const PreparationReaderLive = Layer.effect(
  PreparationReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    // Reused SQL contains only column selection and joins; object assembly stays in TypeScript.
    const assignmentColumns = sql`p.id,p.name,s.id AS specialization_id,s.name AS specialization_name,s.code AS specialization_code,s.description AS specialization_description,k.id AS qualification_kind_id,k.name AS qualification_kind_name,k.code AS qualification_kind_code,q.id AS qualification_scope_id,q.name AS qualification_scope_name,q.code AS qualification_scope_code,up.access_scope,up.archived_at,g.version,g.exam_session_id,e.name AS session_name,e.is_confirmed AS session_is_confirmed,e.written_at,e.oral_planning_at,g.oral_exam_date`
    const assignmentTables = sql`FROM user_qualification_paths up JOIN qualification_paths p ON p.id=up.qualification_path_id JOIN specializations s ON s.id=p.specialization_id JOIN qualification_kinds k ON k.id=p.qualification_kind_id JOIN qualification_scopes q ON q.id=p.qualification_scope_id JOIN user_exam_goals g ON g.user_id=up.user_id AND g.qualification_path_id=p.id JOIN exam_sessions e ON e.id=g.exam_session_id`
    const latestGoal = sql`g.version=(SELECT max(h.version) FROM user_exam_goals h WHERE h.user_id=up.user_id AND h.qualification_path_id=p.id)`

    return PreparationReader.of({
      hasReachedPathLimit: Effect.fn('PreparationReader.hasReachedPathLimit')(
        function* (userId) {
          const offset = maxUserQualificationPaths - 1

          const rows =
            yield* sql`SELECT 1 FROM user_qualification_paths WHERE user_id=${userId} OFFSET ${offset} LIMIT 1`

          return rows.length > 0
        },
        Effect.catchTags({ SqlError: cause => Effect.fail(new PreparationReadError({ cause })) }),
      ),
      paths: Effect.fn('PreparationReader.paths')(
        function* (userId, req) {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(AssignmentCursor, req.cursor)

          const afterCursor =
            cursor === undefined
              ? sql`true`
              : sql`(up.updated_at < ${DateTime.formatIso(cursor.at)} OR (up.updated_at = ${DateTime.formatIso(cursor.at)} AND p.id > ${cursor.id}))`

          const rows =
            yield* sql`SELECT ${assignmentColumns},up.updated_at ${assignmentTables} WHERE up.user_id=${userId} AND ${latestGoal} AND ${afterCursor} ORDER BY up.updated_at DESC,p.id ASC LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(AssignmentPageRow))(rows)

          const page = makeCursorPage(data, limit, row =>
            Schema.encodeSync(AssignmentCursor)({
              at: row.updatedAt,
              id: row.id,
            }),
          )

          return { ...page, data: page.data.map(assignmentFromRow) }
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
            yield* sql`SELECT g.version,g.exam_session_id,g.access_scope,e.name AS session_name,e.is_confirmed AS session_is_confirmed,e.written_at,e.oral_planning_at,g.oral_exam_date FROM user_exam_goals g JOIN exam_sessions e ON e.id=g.exam_session_id WHERE g.user_id=${userId} AND g.qualification_path_id=${pathId} AND ${afterCursor} ORDER BY g.version DESC LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(UserExamGoal))(rows)

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
