import {
  allTimeRanking,
  lastMonthRanking,
  lastWeekRanking,
  type RankingPeriod,
  thisMonthRanking,
  thisWeekRanking,
} from '@inzpro/domain/modules/rankings/ranking'
import type { DateTime } from 'effect'
import {
  allTimeXpPeriod,
  type XpPeriod,
} from '~api/modules/learning-xp/domain/learning-xp.model.js'
import {
  monthlyXpPeriodOf,
  previousMonthlyXpPeriodOf,
  previousWeeklyXpPeriodOf,
  weeklyXpPeriodOf,
} from '~api/modules/learning-xp/domain/learning-xp.rules.js'

export const rankingXpPeriod = (period: RankingPeriod, now: DateTime.Utc): XpPeriod => {
  switch (period) {
    case thisWeekRanking:
      return weeklyXpPeriodOf(now)
    case lastWeekRanking:
      return previousWeeklyXpPeriodOf(now)
    case thisMonthRanking:
      return monthlyXpPeriodOf(now)
    case lastMonthRanking:
      return previousMonthlyXpPeriodOf(now)
    case allTimeRanking:
      return allTimeXpPeriod
  }
}
