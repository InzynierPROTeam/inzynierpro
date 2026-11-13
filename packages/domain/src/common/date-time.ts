import { DateTime, Option, Schema, SchemaTransformation } from 'effect'

export const UtcIsoDateTime = Schema.String.check(
  Schema.makeFilter<string>(
    value =>
      Schema.decodeOption(Schema.DateTimeUtcFromString)(value).pipe(
        Option.exists(date => DateTime.formatIso(date) === value),
      ),
    { message: 'Expected a valid UTC ISO 8601 timestamp with milliseconds.' },
  ),
).pipe(Schema.brand('UtcIsoDateTime'))

export type UtcIsoDateTime = typeof UtcIsoDateTime.Type

export const DateTimeUtc = Schema.Union([Schema.Date, Schema.String])
  .check(
    Schema.makeFilter(value => Option.isSome(DateTime.make(value)), {
      message: 'Expected a valid date or timestamp.',
    }),
  )
  .pipe(
    Schema.decodeTo(
      Schema.DateTimeUtc,
      SchemaTransformation.transform({
        decode: value =>
          value instanceof Date ? DateTime.fromDateUnsafe(value) : DateTime.makeUnsafe(value),
        encode: value => DateTime.formatIso(value),
      }),
    ),
  )

export type DateTimeUtc = typeof DateTimeUtc.Type

export const utcIsoDateTimeToDateTimeUtc = (value: UtcIsoDateTime): DateTime.Utc =>
  DateTime.makeUnsafe(value)

export const dateTimeUtcToUtcIsoDateTime = (value: DateTime.Utc): UtcIsoDateTime =>
  Schema.decodeSync(UtcIsoDateTime)(DateTime.formatIso(value))
