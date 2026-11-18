import type { DailyPlan as DailyPlanDto } from '@inzpro/api-contracts/modules/daily-plan/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  examPassedDailyPlan,
  noMaterialDailyPlan,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import type { DailyPlan } from '~api/modules/daily-plan/domain/daily-plan.model.js'

export const toDailyPlanDto = (plan: DailyPlan): DailyPlanDto => {
  if (plan.status === noMaterialDailyPlan) {
    return { status: plan.status }
  }

  if (plan.status === examPassedDailyPlan) {
    return { status: plan.status, examDate: dateTimeUtcToUtcIsoDateTime(plan.examDay) }
  }

  return {
    status: plan.status,
    examDate: dateTimeUtcToUtcIsoDateTime(plan.examDay),
    targetDate: dateTimeUtcToUtcIsoDateTime(plan.targetDate),
    daysUntilExam: plan.daysUntilExam,
    targetQuestionCount: plan.targetQuestionCount,
    completedQuestionCount: plan.completedQuestionCount,
    questionsBehindPace: plan.questionsBehindPace,
  }
}
