import { Schema } from 'effect'

export const ExternalUrl = Schema.String.check(Schema.isPattern(/^https?:\/\/\S+$/))

export type ExternalUrl = typeof ExternalUrl.Type
