import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { BadgeCode } from '@inzpro/domain/modules/learning-xp/badge'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type DateTime, Schema } from 'effect'

export const weeklyXp = 'week'
export const monthlyXp = 'month'
export const examSessionXp = 'exam_session'
export const allTimeXp = 'all_time'
export const xpPeriodKinds = [weeklyXp, monthlyXp, examSessionXp, allTimeXp] as const

export type XpPeriodKind = (typeof xpPeriodKinds)[number]

export const XpPeriodTotal = Schema.Struct({ total: LearningXp, reachedAt: DateTimeUtc })

export type XpPeriodTotal = typeof XpPeriodTotal.Type

export type XpPeriod = { readonly kind: XpPeriodKind; readonly key: string }

export const allTimeXpPeriod: XpPeriod = { kind: allTimeXp, key: 'all' }

export const writtenAnswerXpReason = 'written_answer'
export const oralSelfAssessmentXpReason = 'oral_self_assessment'
export const quizCheckXpReason = 'quiz_check'
export const examAnswerXpReason = 'exam_answer'
export const finishedExamXpReason = 'exam_finished'
export const completedRoundXpReason = 'round_completed'
export const badgeXpReason = 'badge'

export const xpReasons = [
  writtenAnswerXpReason,
  oralSelfAssessmentXpReason,
  quizCheckXpReason,
  examAnswerXpReason,
  finishedExamXpReason,
  completedRoundXpReason,
  badgeXpReason,
] as const

export type XpReason = (typeof xpReasons)[number]

export const DailyXpAwardLimit = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('DailyXpAwardLimit'),
)

export type DailyXpAwardLimit = typeof DailyXpAwardLimit.Type

export type XpAward = {
  readonly reason: XpReason
  readonly userId: UserId
  readonly pathId: QualificationPathId
  readonly examSessionId: ExamSessionId
  readonly amount: LearningXp
  readonly awardKey: string
  readonly awardedAt: DateTime.Utc
}

export type BadgeXpAward = XpAward & {
  readonly reason: typeof badgeXpReason
  readonly badgeCode: BadgeCode
}
