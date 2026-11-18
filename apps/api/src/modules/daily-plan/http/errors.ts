import {
  DailyPlanSettingsConflict,
  InvalidDailyPlanSettings,
} from '@inzpro/api-contracts/modules/daily-plan/errors'
import { Effect } from 'effect'

export const invalidDailyPlanSettings = Effect.fail(
  new InvalidDailyPlanSettings({
    type: 'invalid_daily_plan_settings',
    message: 'The preparation end date must fall between today and the day before the exam.',
  }),
)

export const dailyPlanSettingsConflict = Effect.fail(
  new DailyPlanSettingsConflict({
    type: 'daily_plan_settings_conflict',
    message: 'The plan settings changed in the meantime. Review them and try again.',
  }),
)
