import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { formatWarsawIsoDate, warsawMonthStartOf, warsawWeekStartOf } from '@inzpro/utils/date'
import { DateTime } from 'effect'

import {
  allTimeXpPeriod,
  examSessionXp,
  monthlyXp,
  weeklyXp,
  type XpAward,
  type XpPeriod,
} from './learning-xp.model.js'

export const xpStudyDate = (at: DateTime.Utc) => formatWarsawIsoDate(at)

export const weeklyXpPeriodOf = (at: DateTime.DateTime): XpPeriod => ({
  kind: weeklyXp,
  key: formatWarsawIsoDate(warsawWeekStartOf(at)),
})

export const previousWeeklyXpPeriodOf = (at: DateTime.DateTime) =>
  weeklyXpPeriodOf(DateTime.subtract(warsawWeekStartOf(at), { days: 1 }))

export const monthlyXpPeriodOf = (at: DateTime.DateTime): XpPeriod => ({
  kind: monthlyXp,
  key: formatWarsawIsoDate(warsawMonthStartOf(at)),
})

export const previousMonthlyXpPeriodOf = (at: DateTime.DateTime) =>
  monthlyXpPeriodOf(DateTime.subtract(warsawMonthStartOf(at), { days: 1 }))

export const examSessionXpPeriodOf = (examSessionId: ExamSessionId): XpPeriod => ({
  kind: examSessionXp,
  key: examSessionId,
})

export const xpPeriodsOf = (
  award: Pick<XpAward, 'awardedAt' | 'examSessionId'>,
): ReadonlyArray<XpPeriod> => [
  weeklyXpPeriodOf(award.awardedAt),
  monthlyXpPeriodOf(award.awardedAt),
  examSessionXpPeriodOf(award.examSessionId),
  allTimeXpPeriod,
]
