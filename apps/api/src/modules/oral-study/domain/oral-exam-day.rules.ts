import { type DateTime, Option } from 'effect'
import type { UserExamGoal } from '~api/modules/preparation/domain/preparation.model.js'

export const oralExamAt = (
  goal: Pick<UserExamGoal, 'oralExamDate' | 'oralPlanningAt'>,
): DateTime.Utc => Option.getOrElse(goal.oralExamDate, () => goal.oralPlanningAt)
