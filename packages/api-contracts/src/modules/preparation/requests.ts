import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const CompleteOnboardingPayload = Schema.Struct({
  specializationId: SpecializationId,
  qualificationKindId: QualificationKindId,
  qualificationScopeId: QualificationScopeId,
  accessScope: ExamAccessScope,
  examSessionId: ExamSessionId,
  oralExamDate: Schema.NullOr(UtcIsoDateTime),
})

export type CompleteOnboardingPayload = typeof CompleteOnboardingPayload.Type

export const PathParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const ChangeGoalPayload = Schema.Struct({
  examSessionId: ExamSessionId,
  oralExamDate: Schema.NullOr(UtcIsoDateTime),
  expectedVersion: UserExamGoalVersion,
})

export type ChangeGoalPayload = typeof ChangeGoalPayload.Type

export const PathsQuery = CursorPagination
export const GoalHistoryQuery = CursorPagination
export const GoalOptionsQuery = CursorPagination
