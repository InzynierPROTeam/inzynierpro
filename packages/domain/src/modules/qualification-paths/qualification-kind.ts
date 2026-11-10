import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QualificationKindId = Uuid.pipe(Schema.brand('QualificationKindId'))

export type QualificationKindId = typeof QualificationKindId.Type

export const QualificationKind = Schema.Struct({
  id: QualificationKindId,
  name: Schema.NonEmptyString,
})

export type QualificationKind = typeof QualificationKind.Type
