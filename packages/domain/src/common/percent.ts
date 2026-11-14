import { Schema } from 'effect'

/** A share of a whole from 0 to 1, kept unrounded until it is shown. */
export const Ratio = Schema.Number.check(
  Schema.isFinite(),
  Schema.isBetween({ minimum: 0, maximum: 1 }),
).pipe(Schema.brand('Ratio'))

export type Ratio = typeof Ratio.Type

/** A whole percentage from 0 to 100, as shown in progress bars. */
export const Percent = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100 })).pipe(
  Schema.brand('Percent'),
)

export type Percent = typeof Percent.Type

/** Rounds to the nearest whole percent, as V1 shows progress. */
export const ratioToPercent = (ratio: Ratio): Percent => Percent.make(Math.round(ratio * 100))
