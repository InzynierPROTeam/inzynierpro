import { Schema } from 'effect'

export const thisWeekRanking = 'this_week'
export const lastWeekRanking = 'last_week'
export const thisMonthRanking = 'this_month'
export const lastMonthRanking = 'last_month'
export const allTimeRanking = 'all_time'

export const rankingPeriodValues = [
  thisWeekRanking,
  lastWeekRanking,
  thisMonthRanking,
  lastMonthRanking,
  allTimeRanking,
] as const

export const RankingPeriod = Schema.Literals(rankingPeriodValues)

export type RankingPeriod = typeof RankingPeriod.Type

export const rankingSize = 100

export const RankingPosition = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)).pipe(
  Schema.brand('RankingPosition'),
)

export type RankingPosition = typeof RankingPosition.Type
