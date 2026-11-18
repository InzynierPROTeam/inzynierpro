import { Schema } from 'effect'

export const DayCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('DayCount'),
)

export type DayCount = typeof DayCount.Type

export const DailyPlanSettingsVersion = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('DailyPlanSettingsVersion'),
)

export type DailyPlanSettingsVersion = typeof DailyPlanSettingsVersion.Type

export const defaultDailyPlanSettingsVersion = DailyPlanSettingsVersion.make(1)

export const plannedDailyPlan = 'planned'
export const finalDaysDailyPlan = 'final_days'
export const roundCompletedDailyPlan = 'round_completed'
export const examPassedDailyPlan = 'exam_passed'
export const noMaterialDailyPlan = 'no_material'

export const scheduledDailyPlanStatusValues = [
  plannedDailyPlan,
  finalDaysDailyPlan,
  roundCompletedDailyPlan,
] as const

export const ScheduledDailyPlanStatus = Schema.Literals(scheduledDailyPlanStatusValues)

export type ScheduledDailyPlanStatus = typeof ScheduledDailyPlanStatus.Type
