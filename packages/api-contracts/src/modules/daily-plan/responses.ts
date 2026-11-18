import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  DailyPlanSettingsVersion,
  DayCount,
  examPassedDailyPlan,
  noMaterialDailyPlan,
  ScheduledDailyPlanStatus,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'
import { PlanPreference } from '~api-contracts/modules/daily-plan/requests.js'

export const DailyPlanSettings = Schema.Struct({
  version: DailyPlanSettingsVersion,
  // CONTRACT: An own targetDate is the instant its Europe/Warsaw day starts.
  preference: PlanPreference,
})

export type DailyPlanSettings = typeof DailyPlanSettings.Type

// CONTRACT: examDate and targetDate are the instant the Europe/Warsaw day starts.
export const DailyPlan = Schema.Union([
  Schema.Struct({ status: Schema.Literal(noMaterialDailyPlan), settings: DailyPlanSettings }),
  Schema.Struct({
    status: Schema.Literal(examPassedDailyPlan),
    examDate: UtcIsoDateTime,
    settings: DailyPlanSettings,
  }),
  Schema.Struct({
    status: ScheduledDailyPlanStatus,
    settings: DailyPlanSettings,
    examDate: UtcIsoDateTime,
    // CONTRACT: With a fixed daily count, the day the uncovered questions run out at that pace, which may follow the exam.
    targetDate: UtcIsoDateTime,
    // CONTRACT: Europe/Warsaw days before the exam day, today included and the exam day excluded.
    daysUntilExam: DayCount,
    targetQuestionCount: QuestionCount,
    completedQuestionCount: QuestionCount,
    questionsBehindPace: QuestionCount,
  }),
])

export type DailyPlan = typeof DailyPlan.Type
