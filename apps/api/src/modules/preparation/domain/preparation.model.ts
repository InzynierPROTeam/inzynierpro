import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { type DateTime, type Option, Schema } from 'effect'
import { DistrictChamber } from '~api/modules/exam-calendar/domain/district-chamber.model.js'
import {
  type PathSelection,
  QualificationKind,
  QualificationPath,
  QualificationScope,
  Specialization,
} from '~api/modules/qualification-paths/domain/qualification-path.model.js'

export const UserExamGoal = Schema.Struct({
  version: UserExamGoalVersion,
  examSessionId: ExamSessionId,
  sessionName: Schema.String,
  sessionIsConfirmed: Schema.Boolean,
  writtenAt: DateTimeUtc,
  oralPlanningAt: DateTimeUtc,
  oralExamDate: Schema.OptionFromNullOr(DateTimeUtc),
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
  districtChamber: Schema.OptionFromNullOr(DistrictChamber),
  goal: UserExamGoal,
})

export type UserQualificationPath = typeof UserQualificationPath.Type

export type PathConfiguration = PathSelection & {
  readonly accessScope: ExamAccessScope
  readonly examSessionId: ExamSessionId
  readonly oralExamDate: Option.Option<DateTime.Utc>
}

export type GoalChange = {
  readonly examSessionId: ExamSessionId
  readonly oralExamDate: Option.Option<DateTime.Utc>
  readonly expectedVersion: UserExamGoalVersion
}
