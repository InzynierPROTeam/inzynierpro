import { Schema } from 'effect'
import { ApiDateTime } from '~domain/common/date-time.js'
import { ExamSessionId } from '~domain/modules/exam-calendar/exam-session.js'
import { ExamAccessScope } from '~domain/modules/preparation/exam-access.js'

export const UserExamGoalVersion = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('UserExamGoalVersion'),
)

export type UserExamGoalVersion = typeof UserExamGoalVersion.Type

export const initialUserExamGoalVersion = UserExamGoalVersion.make(1)

export const nextUserExamGoalVersion = (version: UserExamGoalVersion) =>
  UserExamGoalVersion.make(version + 1)

export const UserExamGoal = Schema.Struct({
  version: UserExamGoalVersion,
  examSessionId: ExamSessionId,
  sessionName: Schema.String,
  writtenAt: ApiDateTime,
  oralPlanningAt: ApiDateTime,
  oralExamDate: Schema.OptionFromNullOr(ApiDateTime),
  accessScope: ExamAccessScope,
})

export type UserExamGoal = typeof UserExamGoal.Type
