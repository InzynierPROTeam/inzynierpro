import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  DistrictChamberCode,
  DistrictChamberId,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import {
  QualificationKindCode,
  QualificationKindId,
} from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  QualificationScopeCode,
  QualificationScopeId,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import {
  SpecializationCode,
  SpecializationId,
} from '@inzpro/domain/modules/qualification-paths/specialization'
import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { PreparationReadError } from '~api/modules/preparation/application/errors.js'
import { PreparationReader } from '~api/modules/preparation/application/preparation.reader.js'
import type {
  UserExamGoal,
  UserQualificationPath,
} from '~api/modules/preparation/domain/preparation.model.js'

const GoalRow = Schema.Struct({
  version: UserExamGoalVersion,
  examSessionId: ExamSessionId,
  sessionName: Schema.String,
  sessionIsConfirmed: Schema.Boolean,
  writtenAt: DateTimeUtc,
  oralPlanningAt: DateTimeUtc,
  oralExamDate: Schema.NullOr(DateTimeUtc),
  accessScope: ExamAccessScope,
})

const AssignmentRow = Schema.Struct({
  ...GoalRow.fields,
  id: QualificationPathId,
  name: Schema.NonEmptyString,
  specializationId: SpecializationId,
  specializationCode: SpecializationCode,
  specializationName: Schema.NonEmptyString,
  specializationDescription: Schema.NullOr(Schema.NonEmptyString),
  qualificationKindId: QualificationKindId,
  qualificationKindCode: QualificationKindCode,
  qualificationKindName: Schema.NonEmptyString,
  qualificationScopeId: QualificationScopeId,
  qualificationScopeCode: QualificationScopeCode,
  qualificationScopeName: Schema.NonEmptyString,
  pathVersion: UserQualificationPathVersion,
  archivedAt: Schema.NullOr(DateTimeUtc),
  districtChamberId: Schema.NullOr(DistrictChamberId),
  districtChamberCode: Schema.NullOr(DistrictChamberCode),
  districtChamberName: Schema.NullOr(Schema.NonEmptyString),
  districtChamberShortName: Schema.NullOr(Schema.NonEmptyString),
})

const AssignmentPageRow = Schema.Struct({ ...AssignmentRow.fields, updatedAt: DateTimeUtc })

const goalFromRow = (row: typeof GoalRow.Type): UserExamGoal => ({
  version: row.version,
  examSessionId: row.examSessionId,
  sessionName: row.sessionName,
  sessionIsConfirmed: row.sessionIsConfirmed,
  accessScope: row.accessScope,
  writtenAt: row.writtenAt,
  oralPlanningAt: row.oralPlanningAt,
  oralExamDate: Option.fromNullishOr(row.oralExamDate),
})

const districtChamberFromRow = (row: typeof AssignmentRow.Type) =>
  row.districtChamberId === null ||
  row.districtChamberCode === null ||
  row.districtChamberName === null ||
  row.districtChamberShortName === null
    ? Option.none()
    : Option.some({
        id: row.districtChamberId,
        code: row.districtChamberCode,
        name: row.districtChamberName,
        shortName: row.districtChamberShortName,
      })

const assignmentFromRow = (row: typeof AssignmentRow.Type): UserQualificationPath => ({
  id: row.id,
  name: row.name,
  specialization: {
    id: row.specializationId,
    name: row.specializationName,
    code: row.specializationCode,
    description: Option.fromNullishOr(row.specializationDescription),
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
  version: row.pathVersion,
  archived: row.archivedAt !== null,
  districtChamber: districtChamberFromRow(row),
  goal: goalFromRow(row),
})

export const PreparationReaderLive = Layer.effect(
  PreparationReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const assignmentColumns = sql`p.id,p.name,s.id AS specialization_id,s.name AS specialization_name,s.code AS specialization_code,s.description AS specialization_description,k.id AS qualification_kind_id,k.name AS qualification_kind_name,k.code AS qualification_kind_code,q.id AS qualification_scope_id,q.name AS qualification_scope_name,q.code AS qualification_scope_code,up.access_scope,up.version AS path_version,up.archived_at,d.id AS district_chamber_id,d.code AS district_chamber_code,d.name AS district_chamber_name,d.short_name AS district_chamber_short_name,g.version,g.exam_session_id,e.name AS session_name,e.is_confirmed AS session_is_confirmed,e.written_at,e.oral_planning_at,g.oral_exam_date`
    const assignmentTables = sql`FROM user_qualification_paths up JOIN qualification_paths p ON p.id=up.qualification_path_id JOIN specializations s ON s.id=p.specialization_id JOIN qualification_kinds k ON k.id=p.qualification_kind_id JOIN qualification_scopes q ON q.id=p.qualification_scope_id JOIN user_exam_goals g ON g.user_id=up.user_id AND g.qualification_path_id=p.id JOIN exam_sessions e ON e.id=g.exam_session_id LEFT JOIN district_chambers d ON d.id=up.district_chamber_id`
    const latestGoal = sql`g.version=(SELECT max(h.version) FROM user_exam_goals h WHERE h.user_id=up.user_id AND h.qualification_path_id=p.id)`

    const pathsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ updatedAt: DateTimeUtc, id: QualificationPathId }),
      [
        ['updatedAt', sql`up.updated_at`, 'desc'],
        ['id', sql`p.id`, 'asc'],
      ],
    )

    const goalsPage = makeCursorPaginator(sql, Schema.Struct({ version: UserExamGoalVersion }), [
      ['version', sql`g.version`, 'desc'],
    ])

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
          const page = yield* pathsPage(
            req,
            window =>
              sql`SELECT ${assignmentColumns},up.updated_at ${assignmentTables} WHERE up.user_id=${userId} AND ${latestGoal} AND ${window.after} ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AssignmentPageRow))),
              ),
            row => ({ updatedAt: row.updatedAt, id: row.id }),
          )

          return mapCursorPage(page, assignmentFromRow)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new PreparationReadError({ cause })),
          SchemaError: cause => Effect.fail(new PreparationReadError({ cause })),
        }),
      ),
      activePaths: Effect.fn('PreparationReader.activePaths')(
        function* (userId) {
          const rows =
            yield* sql`SELECT ${assignmentColumns} ${assignmentTables} WHERE up.user_id=${userId} AND up.archived_at IS NULL AND ${latestGoal} ORDER BY up.updated_at DESC,p.id LIMIT ${maxUserQualificationPaths}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(AssignmentRow))(rows)

          return data.map(assignmentFromRow)
        },
        Effect.mapError(cause => new PreparationReadError({ cause })),
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
          const page = yield* goalsPage(
            req,
            window =>
              sql`SELECT g.version,g.exam_session_id,g.access_scope,e.name AS session_name,e.is_confirmed AS session_is_confirmed,e.written_at,e.oral_planning_at,g.oral_exam_date FROM user_exam_goals g JOIN exam_sessions e ON e.id=g.exam_session_id WHERE g.user_id=${userId} AND g.qualification_path_id=${pathId} AND ${window.after} ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(GoalRow))),
              ),
            row => ({ version: row.version }),
          )

          return mapCursorPage(page, goalFromRow)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new PreparationReadError({ cause })),
          SchemaError: cause => Effect.fail(new PreparationReadError({ cause })),
        }),
      ),
    })
  }),
)
