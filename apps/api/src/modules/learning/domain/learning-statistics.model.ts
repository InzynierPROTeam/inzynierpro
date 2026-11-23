import { Schema } from 'effect'

export const StatisticCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('StatisticCount'),
)

export type StatisticCount = typeof StatisticCount.Type
