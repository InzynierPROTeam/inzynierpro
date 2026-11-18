import type { PlanPreference as PlanPreferenceDto } from '@inzpro/api-contracts/modules/daily-plan/requests'
import type {
  DailyPlan as DailyPlanDto,
  DailyPlanSettings as DailyPlanSettingsDto,
} from '@inzpro/api-contracts/modules/daily-plan/responses'
import {
  dateTimeUtcToUtcIsoDateTime,
  utcIsoDateTimeToDateTimeUtc,
} from '@inzpro/domain/common/date-time'
import {
  examPassedDailyPlan,
  noMaterialDailyPlan,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import type {
  DailyPlan,
  DailyPlanSettings,
  PlanPreference,
} from '~api/modules/daily-plan/domain/daily-plan.model.js'

export const toPlanPreference = (preference: PlanPreferenceDto): PlanPreference =>
  preference.mode === targetDatePlanPreference
    ? { mode: preference.mode, targetDate: utcIsoDateTimeToDateTimeUtc(preference.targetDate) }
    : preference

const toDailyPlanSettingsDto = ({
  version,
  preference,
}: DailyPlanSettings): DailyPlanSettingsDto => ({
  version,
  preference:
    preference.mode === targetDatePlanPreference
      ? { mode: preference.mode, targetDate: dateTimeUtcToUtcIsoDateTime(preference.targetDate) }
      : preference,
})

export const toDailyPlanDto = (plan: DailyPlan): DailyPlanDto => {
  const settings = toDailyPlanSettingsDto(plan.settings)

  if (plan.status === noMaterialDailyPlan) {
    return { status: plan.status, settings }
  }

  if (plan.status === examPassedDailyPlan) {
    return { status: plan.status, examDate: dateTimeUtcToUtcIsoDateTime(plan.examDay), settings }
  }

  return {
    status: plan.status,
    settings,
    examDate: dateTimeUtcToUtcIsoDateTime(plan.examDay),
    targetDate: dateTimeUtcToUtcIsoDateTime(plan.targetDate),
    daysUntilExam: plan.daysUntilExam,
    targetQuestionCount: plan.targetQuestionCount,
    completedQuestionCount: plan.completedQuestionCount,
    questionsBehindPace: plan.questionsBehindPace,
  }
}
