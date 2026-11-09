import { Schema } from 'effect'

export const Uuid = Schema.String.check(Schema.isUUID()).pipe(Schema.brand('Uuid'))

export type Uuid = Schema.Schema.Type<typeof Uuid>
