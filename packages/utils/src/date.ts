import { DateTime, Effect } from 'effect'

export const getCurrentFullYear = (date?: DateTime.DateTime, timeZone: string = 'UTC'): number =>
  Effect.runSync(
    Effect.map(
      date === undefined ? DateTime.now : Effect.succeed(date),
      value =>
        value.pipe(DateTime.setZone(DateTime.zoneMakeNamedUnsafe(timeZone)), DateTime.toParts).year,
    ),
  )
