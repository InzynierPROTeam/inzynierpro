import { Schema } from 'effect'
import { ExamAccessScope } from '~domain/modules/preparation/exam-access.js'
import { UserExamGoal } from '~domain/modules/preparation/user-exam-goal.js'
import { QualificationPath } from '~domain/modules/qualification-paths/qualification-path.js'

export const UserQualificationPath = Schema.Struct({
  ...QualificationPath.fields,
  accessScope: ExamAccessScope,
  archived: Schema.Boolean,
  goal: UserExamGoal,
})

export type UserQualificationPath = typeof UserQualificationPath.Type
