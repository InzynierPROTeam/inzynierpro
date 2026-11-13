import { Schema } from 'effect'

export const UserExamGoalVersion = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('UserExamGoalVersion'),
)

export type UserExamGoalVersion = typeof UserExamGoalVersion.Type

export const initialUserExamGoalVersion = UserExamGoalVersion.make(1)

export const nextUserExamGoalVersion = (version: UserExamGoalVersion) =>
  UserExamGoalVersion.make(version + 1)
