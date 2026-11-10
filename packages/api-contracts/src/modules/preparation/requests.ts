import { ApiDateTime } from '@inzpro/domain/common/date-time'
import { CursorPagination } from '@inzpro/domain/common/pagination'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { PathConfiguration } from '@inzpro/domain/modules/preparation/onboarding'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const SelectPathPayload = Schema.Struct({ qualificationPathId: QualificationPathId })

export const CompleteOnboardingPayload = PathConfiguration

export const PathParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const ChangeGoalPayload = Schema.Struct({
  examSessionId: ExamSessionId,
  oralExamDate: Schema.OptionFromNullOr(ApiDateTime),
  expectedVersion: UserExamGoalVersion,
})

export const PathsQuery = CursorPagination
export const GoalHistoryQuery = CursorPagination
export const GoalOptionsQuery = CursorPagination
