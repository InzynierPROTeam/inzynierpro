import { Schema } from 'effect'
import { ApiDateTime } from '~domain/common/date-time.js'
import { ExamSessionId } from '~domain/modules/exam-calendar/exam-session.js'
import { ExamAccessScope } from '~domain/modules/preparation/exam-access.js'
import { UserExamGoalVersion } from '~domain/modules/preparation/user-exam-goal.js'
import { QualificationKindId } from '~domain/modules/qualification-paths/qualification-kind.js'
import { QualificationScopeId } from '~domain/modules/qualification-paths/qualification-scope.js'
import { SpecializationId } from '~domain/modules/qualification-paths/specialization.js'

export const PathConfiguration = Schema.Struct({
  specializationId: SpecializationId,
  qualificationKindId: QualificationKindId,
  qualificationScopeId: QualificationScopeId,
  accessScope: ExamAccessScope,
  examSessionId: ExamSessionId,
  oralExamDate: Schema.OptionFromNullOr(ApiDateTime),
})

export type PathConfiguration = typeof PathConfiguration.Type

export type PathFilters = Partial<
  Pick<PathConfiguration, 'specializationId' | 'qualificationKindId' | 'qualificationScopeId'>
>

export type GoalChange = Pick<PathConfiguration, 'examSessionId' | 'oralExamDate'> & {
  readonly expectedVersion: UserExamGoalVersion
}
