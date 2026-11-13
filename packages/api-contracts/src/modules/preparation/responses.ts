import { CursorPaginatedResponse } from '@inzpro/domain/common/pagination'
import { ExamSessionOption } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { UserExamGoal } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { UserQualificationPath } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const QualificationPathsResponse = CursorPaginatedResponse(UserQualificationPath)
export const PathResponse = Schema.Struct({ path: Schema.NullOr(UserQualificationPath) })

export const PathMutationResponse = Schema.Struct({
  qualificationPathId: QualificationPathId,
  existing: Schema.Boolean,
  archived: Schema.Boolean,
})

export const GoalHistoryResponse = CursorPaginatedResponse(UserExamGoal)
export const GoalOptionsResponse = CursorPaginatedResponse(ExamSessionOption)
