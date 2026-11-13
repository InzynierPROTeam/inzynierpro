import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import type { UserExamGoal as GoalDto } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { UserQualificationPath as PathDto } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { Option } from 'effect'

import type { UserExamGoal, UserQualificationPath } from './preparation.model.js'

export const toUserExamGoalDto = (goal: UserExamGoal): GoalDto => ({
  ...goal,
  writtenAt: dateTimeUtcToUtcIsoDateTime(goal.writtenAt),
  oralPlanningAt: dateTimeUtcToUtcIsoDateTime(goal.oralPlanningAt),
  oralExamDate: Option.match(goal.oralExamDate, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
})

export const toUserQualificationPathDto = (path: UserQualificationPath): PathDto => ({
  ...path,
  goal: toUserExamGoalDto(path.goal),
})
