import { Schema } from 'effect'
import {
  BadRequestAnnotations,
  ConflictAnnotations,
  errorFields,
} from '~api-contracts/utils/api-error.js'

export class InvalidDailyPlanSettings extends Schema.TaggedError<
  InvalidDailyPlanSettings,
  { readonly brand: unique symbol }
>()(
  'InvalidDailyPlanSettings',
  errorFields('invalid_daily_plan_settings'),
  BadRequestAnnotations(),
) {}

export class DailyPlanSettingsConflict extends Schema.TaggedError<
  DailyPlanSettingsConflict,
  { readonly brand: unique symbol }
>()(
  'DailyPlanSettingsConflict',
  errorFields('daily_plan_settings_conflict'),
  ConflictAnnotations(),
) {}
