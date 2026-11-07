import { Schema } from 'effect'

export const env = Schema.decodeSync(
  Schema.Struct({
    VITE_API_URL: Schema.NonEmptyString,
  }),
)({
  VITE_API_URL: import.meta.env.VITE_API_URL,
})
