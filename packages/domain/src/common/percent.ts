import { Schema } from 'effect'

/** Keep ratios unrounded until presentation. */
export const Ratio = Schema.Number.check(
  Schema.isFinite(),
  Schema.isBetween({ minimum: 0, maximum: 1 }),
).pipe(Schema.brand('Ratio'))

export type Ratio = typeof Ratio.Type

export const Percent = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100 })).pipe(
  Schema.brand('Percent'),
)

export type Percent = typeof Percent.Type

export const ratioToPercent = (ratio: Ratio): Percent => Percent.make(Math.round(ratio * 100))
