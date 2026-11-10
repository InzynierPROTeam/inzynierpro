import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QualificationScopeId = Uuid.pipe(Schema.brand('QualificationScopeId'))

export type QualificationScopeId = typeof QualificationScopeId.Type

export const QualificationScope = Schema.Struct({
  id: QualificationScopeId,
  name: Schema.NonEmptyString,
})

export type QualificationScope = typeof QualificationScope.Type
