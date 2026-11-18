import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  type dailyCountPlanPreference,
  DailyPlanSettingsVersion,
  type DailyQuestionCount,
  type DayCount,
  defaultDailyPlanSettingsVersion,
  defaultPlanPreference,
  type examPassedDailyPlan,
  type noMaterialDailyPlan,
  type ScheduledDailyPlanStatus,
  type targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'

export const DailyPlanRecord = Schema.Struct({
  studyDay: DateTimeUtc,
  round: LearningRoundNumber,
  targetDate: DateTimeUtc,
  remainingQuestionCount: QuestionCount,
  targetQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
  settingsVersion: DailyPlanSettingsVersion,
  roundCompletedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type DailyPlanRecord = typeof DailyPlanRecord.Type

export type NewDailyPlan = Omit<DailyPlanRecord, 'completedQuestionCount' | 'roundCompletedAt'>

export type PlanPreference =
  | { readonly mode: typeof defaultPlanPreference }
  | { readonly mode: typeof targetDatePlanPreference; readonly targetDate: DateTime.Utc }
  | {
      readonly mode: typeof dailyCountPlanPreference
      readonly dailyQuestionCount: DailyQuestionCount
    }

export type DailyPlanSettings = {
  readonly version: DailyPlanSettingsVersion
  readonly preference: PlanPreference
}

export const defaultDailyPlanSettings: DailyPlanSettings = {
  version: defaultDailyPlanSettingsVersion,
  preference: { mode: defaultPlanPreference },
}

export type DailyPlan =
  | { readonly status: typeof noMaterialDailyPlan; readonly settings: DailyPlanSettings }
  | {
      readonly status: typeof examPassedDailyPlan
      readonly examDay: DateTime.Utc
      readonly settings: DailyPlanSettings
    }
  | {
      readonly status: ScheduledDailyPlanStatus
      readonly settings: DailyPlanSettings
      readonly examDay: DateTime.Utc
      readonly targetDate: DateTime.Utc
      readonly daysUntilExam: DayCount
      readonly targetQuestionCount: QuestionCount
      readonly completedQuestionCount: QuestionCount
      readonly questionsBehindPace: QuestionCount
    }

export type DailyPlanSettingsChange = {
  readonly preference: PlanPreference
  readonly expectedVersion: DailyPlanSettingsVersion
}
