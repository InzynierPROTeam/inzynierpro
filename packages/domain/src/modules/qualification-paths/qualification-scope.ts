import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QualificationScopeId = Uuid.pipe(Schema.brand('QualificationScopeId'))

export type QualificationScopeId = typeof QualificationScopeId.Type

export const unrestrictedQualificationScopeCode = 'bez-ograniczen'
export const restrictedQualificationScopeCode = 'w-ograniczonym-zakresie'

export const qualificationScopeCodes = [
  unrestrictedQualificationScopeCode,
  restrictedQualificationScopeCode,
] as const

export const QualificationScopeCode = Schema.Literals(qualificationScopeCodes)

export type QualificationScopeCode = typeof QualificationScopeCode.Type

export const QualificationScope = Schema.Struct({
  code: QualificationScopeCode,
  id: QualificationScopeId,
  name: Schema.NonEmptyString,
})

export type QualificationScope = typeof QualificationScope.Type
