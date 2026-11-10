import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const GeneralChamberId = Uuid.pipe(Schema.brand('GeneralChamberId'))

export type GeneralChamberId = typeof GeneralChamberId.Type
