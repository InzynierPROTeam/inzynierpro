import { Schema } from 'effect'

/** A whole percentage from 0 to 100, as shown in progress bars. */
export const Percent = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100 })).pipe(
  Schema.brand('Percent'),
)

export type Percent = typeof Percent.Type
