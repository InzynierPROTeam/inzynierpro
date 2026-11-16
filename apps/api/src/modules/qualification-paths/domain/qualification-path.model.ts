import {
  QualificationKindCode,
  QualificationKindId,
} from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  QualificationScopeCode,
  QualificationScopeId,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import {
  SpecializationCode,
  SpecializationId,
} from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'

export const Specialization = Schema.Struct({
  id: SpecializationId,
  code: SpecializationCode,
  name: Schema.NonEmptyString,
  description: Schema.OptionFromNullOr(Schema.NonEmptyString),
})

export type Specialization = typeof Specialization.Type

export const QualificationKind = Schema.Struct({
  id: QualificationKindId,
  code: QualificationKindCode,
  name: Schema.NonEmptyString,
})

export type QualificationKind = typeof QualificationKind.Type

export const QualificationScope = Schema.Struct({
  id: QualificationScopeId,
  code: QualificationScopeCode,
  name: Schema.NonEmptyString,
})

export type QualificationScope = typeof QualificationScope.Type

export const QualificationPath = Schema.Struct({
  id: QualificationPathId,
  name: Schema.NonEmptyString,
})

export type QualificationPath = typeof QualificationPath.Type

export type PathSelection = {
  readonly specializationId: SpecializationId
  readonly qualificationKindId: QualificationKindId
  readonly qualificationScopeId: QualificationScopeId
}
