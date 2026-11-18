import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  DailyPlanSettingsVersion,
  type DayCount,
  type examPassedDailyPlan,
  type noMaterialDailyPlan,
  type ScheduledDailyPlanStatus,
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

export type DailyPlan =
  | { readonly status: typeof noMaterialDailyPlan }
  | { readonly status: typeof examPassedDailyPlan; readonly examDay: DateTime.Utc }
  | {
      readonly status: ScheduledDailyPlanStatus
      readonly examDay: DateTime.Utc
      readonly targetDate: DateTime.Utc
      readonly daysUntilExam: DayCount
      readonly targetQuestionCount: QuestionCount
      readonly completedQuestionCount: QuestionCount
      readonly questionsBehindPace: QuestionCount
    }
