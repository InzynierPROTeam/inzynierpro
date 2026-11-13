import { Schema } from 'effect'
import { ExamAccessScope } from '~domain/modules/preparation/exam-access.js'
import { UserExamGoal } from '~domain/modules/preparation/user-exam-goal.js'
import { QualificationKind } from '~domain/modules/qualification-paths/qualification-kind.js'
import { QualificationPath } from '~domain/modules/qualification-paths/qualification-path.js'
import { QualificationScope } from '~domain/modules/qualification-paths/qualification-scope.js'
import { Specialization } from '~domain/modules/qualification-paths/specialization.js'

export const UserQualificationPath = Schema.Struct({
  ...QualificationPath.fields,
  specialization: Specialization,
  qualificationKind: QualificationKind,
  qualificationScope: QualificationScope,
  accessScope: ExamAccessScope,
  archived: Schema.Boolean,
  goal: UserExamGoal,
})

export type UserQualificationPath = typeof UserQualificationPath.Type
