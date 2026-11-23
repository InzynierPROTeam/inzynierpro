import {
  allTimeRanking,
  lastMonthRanking,
  lastWeekRanking,
  type RankingPeriod,
  thisMonthRanking,
  thisWeekRanking,
} from '@inzpro/domain/modules/rankings/ranking'
import { getRouteApi } from '@tanstack/react-router'

import {
  allTimeOption,
  type examSessionOption,
  lastMonthOption,
  lastWeekOption,
  type RankingPeriodOption,
  thisMonthOption,
  thisWeekOption,
} from './validation'

export const rankingRouteApi = getRouteApi('/(app)/_authenticated/_onboarded/ranking')

export const rankingPeriodOf: Record<
  Exclude<RankingPeriodOption, typeof examSessionOption>,
  RankingPeriod
> = {
  [thisWeekOption]: thisWeekRanking,
  [lastWeekOption]: lastWeekRanking,
  [thisMonthOption]: thisMonthRanking,
  [lastMonthOption]: lastMonthRanking,
  [allTimeOption]: allTimeRanking,
}
