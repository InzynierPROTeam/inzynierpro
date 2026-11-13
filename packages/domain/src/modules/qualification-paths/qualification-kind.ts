import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QualificationKindId = Uuid.pipe(Schema.brand('QualificationKindId'))

export type QualificationKindId = typeof QualificationKindId.Type

export const constructionQualificationKindCode = 'kierowanie'
export const designQualificationKindCode = 'projektowanie'
export const combinedQualificationKindCode = 'laczne'

export const qualificationKindCodes = [
  constructionQualificationKindCode,
  designQualificationKindCode,
  combinedQualificationKindCode,
] as const

export const QualificationKindCode = Schema.Literals(qualificationKindCodes)

export type QualificationKindCode = typeof QualificationKindCode.Type

export const QualificationKind = Schema.Struct({
  code: QualificationKindCode,
  id: QualificationKindId,
  name: Schema.NonEmptyString,
})

export type QualificationKind = typeof QualificationKind.Type
