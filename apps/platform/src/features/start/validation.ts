import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  dailyCountPlanPreference,
  DailyQuestionCount,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { Schema } from 'effect'

export const customPlanPreferenceValues = [
  targetDatePlanPreference,
  dailyCountPlanPreference,
] as const

export const PlanSettingsValues = Schema.Struct({
  mode: Schema.Literals(customPlanPreferenceValues),
  targetDate: Schema.String,
  dailyQuestionCount: DailyQuestionCount,
}).check(
  Schema.makeFilter(values =>
    values.mode === targetDatePlanPreference && !Schema.is(UtcIsoDateTime)(values.targetDate)
      ? { path: ['targetDate'], issue: 'Wybierz dzień zakończenia przygotowań.' }
      : undefined,
  ),
)

export type PlanSettingsValues = typeof PlanSettingsValues.Type
