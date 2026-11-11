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

export const ApiDateTime = UtcIsoDateTime.pipe(
  Schema.decodeTo(
    Schema.DateTimeUtc,
    SchemaTransformation.transform({
      decode: value => DateTime.toUtc(DateTime.makeUnsafe(value)),
      encode: value => Schema.decodeSync(UtcIsoDateTime)(DateTime.formatIso(value)),
    }),
  ),
  Schema.brand('ApiDateTime'),
)

export type ApiDateTime = typeof ApiDateTime.Type
