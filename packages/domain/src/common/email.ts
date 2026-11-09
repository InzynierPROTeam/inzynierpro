import { Schema } from 'effect'

export const Email = Schema.String.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)).pipe(
  Schema.brand('Email'),
)

export type Email = Schema.Schema.Type<typeof Email>
