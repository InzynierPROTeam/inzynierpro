import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  dailyCountPlanPreference,
  DailyPlanSettingsVersion,
  DailyQuestionCount,
  defaultPlanPreference,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { Schema } from 'effect'

// CONTRACT: targetDate is any instant within the chosen Europe/Warsaw day.
export const PlanPreference = Schema.Union([
  Schema.Struct({ mode: Schema.Literal(defaultPlanPreference) }),
  Schema.Struct({ mode: Schema.Literal(targetDatePlanPreference), targetDate: UtcIsoDateTime }),
  Schema.Struct({
    mode: Schema.Literal(dailyCountPlanPreference),
    dailyQuestionCount: DailyQuestionCount,
  }),
])

export type PlanPreference = typeof PlanPreference.Type

export const ChangeDailyPlanSettingsPayload = Schema.Struct({
  preference: PlanPreference,
  expectedVersion: DailyPlanSettingsVersion,
})

export type ChangeDailyPlanSettingsPayload = typeof ChangeDailyPlanSettingsPayload.Type
