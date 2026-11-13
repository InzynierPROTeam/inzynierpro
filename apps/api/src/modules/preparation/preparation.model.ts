import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { PathConfiguration as ConfigurationDto } from '@inzpro/domain/modules/preparation/onboarding'
import { UserExamGoal as GoalDto } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { UserQualificationPath as PathDto } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { Schema } from 'effect'

export const UserExamGoal = Schema.Struct({
  ...GoalDto.fields,
  writtenAt: DateTimeUtc,
  oralPlanningAt: DateTimeUtc,
  oralExamDate: Schema.OptionFromNullOr(DateTimeUtc),
})

export type UserExamGoal = typeof UserExamGoal.Type

export const UserQualificationPath = Schema.Struct({ ...PathDto.fields, goal: UserExamGoal })

export type UserQualificationPath = typeof UserQualificationPath.Type

export const PathConfiguration = Schema.Struct({
  ...ConfigurationDto.fields,
  oralExamDate: Schema.OptionFromNullOr(DateTimeUtc),
})

export type PathConfiguration = typeof PathConfiguration.Type

export const GoalChange = Schema.Struct({
  examSessionId: ConfigurationDto.fields.examSessionId,
  oralExamDate: Schema.OptionFromNullOr(DateTimeUtc),
  expectedVersion: GoalDto.fields.version,
})

export type GoalChange = typeof GoalChange.Type
