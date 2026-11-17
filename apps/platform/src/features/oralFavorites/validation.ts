import { Schema } from 'effect'

export const OralFavoritesPreviewSearch = Schema.Struct({
  'liczba-pytan': Schema.optional(Schema.Int.check(Schema.isGreaterThan(0))),
})
