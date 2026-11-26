import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import {
  GeneralChamberContacts,
  DistrictChamberContacts,
} from '~api-contracts/modules/exam-calendar/responses.js'
import {
  DistrictChamber,
  ExamSessionOption,
} from '~api-contracts/modules/exam-calendar/responses.js'
import {
  QualificationKind,
  QualificationPath,
  QualificationScope,
  Specialization,
} from '~api-contracts/modules/qualification-paths/responses.js'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const UserExamGoal = Schema.Struct({
  version: UserExamGoalVersion,
  examSessionId: ExamSessionId,
  sessionName: Schema.String,
  sessionIsConfirmed: Schema.Boolean,
  writtenAt: UtcIsoDateTime,
  oralPlanningAt: UtcIsoDateTime,
  oralExamDate: Schema.NullOr(UtcIsoDateTime),
  accessScope: ExamAccessScope,
})

export type UserExamGoal = typeof UserExamGoal.Type

export const UserQualificationPath = Schema.Struct({
  ...QualificationPath.fields,
  specialization: Specialization,
  qualificationKind: QualificationKind,
  qualificationScope: QualificationScope,
  accessScope: ExamAccessScope,
  version: UserQualificationPathVersion,
  archived: Schema.Boolean,
  districtChamber: Schema.NullOr(DistrictChamber),
  goal: UserExamGoal,
})

export type UserQualificationPath = typeof UserQualificationPath.Type

export const QualificationPathsResponse = CursorPaginatedResponse(UserQualificationPath)
export const PathResponse = Schema.Struct({ path: Schema.NullOr(UserQualificationPath) })

export const PathMutationResponse = Schema.Struct({
  qualificationPathId: QualificationPathId,
  existing: Schema.Boolean,
  archived: Schema.Boolean,
})

export const GoalHistoryResponse = CursorPaginatedResponse(UserExamGoal)
export const GoalOptionsResponse = CursorPaginatedResponse(ExamSessionOption)

export const MyChamberResponse = Schema.Struct({
  generalChamber: GeneralChamberContacts,
  districtChamber: Schema.NullOr(DistrictChamberContacts),
})
