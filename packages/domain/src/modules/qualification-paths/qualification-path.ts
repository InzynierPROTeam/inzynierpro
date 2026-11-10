import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QualificationPathId = Uuid.pipe(Schema.brand('QualificationPathId'))

export type QualificationPathId = typeof QualificationPathId.Type

export const QualificationPath = Schema.Struct({
  id: QualificationPathId,
  name: Schema.NonEmptyString,
})

export type QualificationPath = typeof QualificationPath.Type
