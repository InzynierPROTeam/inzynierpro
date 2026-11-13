import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QualificationPathId = Uuid.pipe(Schema.brand('QualificationPathId'))

export type QualificationPathId = typeof QualificationPathId.Type
