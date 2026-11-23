import { Schema } from 'effect'

export const thisWeekOption = 'tydzien'
export const lastWeekOption = 'poprzedni-tydzien'
export const thisMonthOption = 'miesiac'
export const lastMonthOption = 'poprzedni-miesiac'
export const examSessionOption = 'sesja'
export const allTimeOption = 'od-poczatku'

export const rankingPeriodOptionValues = [
  thisWeekOption,
  lastWeekOption,
  thisMonthOption,
  lastMonthOption,
  examSessionOption,
  allTimeOption,
] as const

export const RankingPeriodOption = Schema.Literals(rankingPeriodOptionValues)

export type RankingPeriodOption = typeof RankingPeriodOption.Type

export const RankingSearch = Schema.Struct({
  okres: Schema.optional(RankingPeriodOption),
})
