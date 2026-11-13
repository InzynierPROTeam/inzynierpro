import { Schema } from 'effect'

export const defaultPageLimit = 20
export const maximumPageLimit = 100

export const PageLimit = Schema.Int.check(
  Schema.isBetween({ minimum: 1, maximum: maximumPageLimit }),
).pipe(Schema.brand('PageLimit'))

export type PageLimit = typeof PageLimit.Type

export const PageNumber = Schema.Int.check(Schema.isGreaterThan(0)).pipe(Schema.brand('PageNumber'))

export type PageNumber = typeof PageNumber.Type

/** An opaque continuation token. Clients pass it back unchanged and never build or parse it. */
export const Cursor = Schema.NonEmptyString.check(Schema.isMaxLength(512)).pipe(
  Schema.brand('Cursor'),
)

export type Cursor = typeof Cursor.Type
