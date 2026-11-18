import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { DateTime } from 'effect'

export const weeklyXp = 'week'
export const monthlyXp = 'month'
export const examSessionXp = 'exam_session'
export const allTimeXp = 'all_time'
export const xpPeriodKinds = [weeklyXp, monthlyXp, examSessionXp, allTimeXp] as const

export type XpPeriodKind = (typeof xpPeriodKinds)[number]

export type XpPeriod = { readonly kind: XpPeriodKind; readonly key: string }

export type XpAward = {
  readonly userId: UserId
  readonly pathId: QualificationPathId
  readonly examSessionId: ExamSessionId
  readonly amount: LearningXp
  readonly awardKey: string
  readonly awardedAt: DateTime.Utc
}
