import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  DayCount,
  examPassedDailyPlan,
  noMaterialDailyPlan,
  ScheduledDailyPlanStatus,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

// CONTRACT: examDate and targetDate are the instant the Europe/Warsaw day starts.
export const DailyPlan = Schema.Union([
  Schema.Struct({ status: Schema.Literal(noMaterialDailyPlan) }),
  Schema.Struct({ status: Schema.Literal(examPassedDailyPlan), examDate: UtcIsoDateTime }),
  Schema.Struct({
    status: ScheduledDailyPlanStatus,
    examDate: UtcIsoDateTime,
    targetDate: UtcIsoDateTime,
    // CONTRACT: Europe/Warsaw days before the exam day, today included and the exam day excluded.
    daysUntilExam: DayCount,
    targetQuestionCount: QuestionCount,
    completedQuestionCount: QuestionCount,
    questionsBehindPace: QuestionCount,
  }),
])

export type DailyPlan = typeof DailyPlan.Type
