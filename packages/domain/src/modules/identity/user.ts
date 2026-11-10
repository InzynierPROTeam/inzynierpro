import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const UserId = Uuid.pipe(Schema.brand('UserId'))

export type UserId = typeof UserId.Type
