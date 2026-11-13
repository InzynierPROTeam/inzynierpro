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
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const Specialization = Schema.Struct({
  code: SpecializationCode,
  id: SpecializationId,
  name: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.NonEmptyString),
})

export type Specialization = typeof Specialization.Type

export const QualificationKind = Schema.Struct({
  code: QualificationKindCode,
  id: QualificationKindId,
  name: Schema.NonEmptyString,
})

export type QualificationKind = typeof QualificationKind.Type

export const QualificationScope = Schema.Struct({
  code: QualificationScopeCode,
  id: QualificationScopeId,
  name: Schema.NonEmptyString,
})

export type QualificationScope = typeof QualificationScope.Type

export const QualificationPath = Schema.Struct({
  id: QualificationPathId,
  name: Schema.NonEmptyString,
})

export type QualificationPath = typeof QualificationPath.Type

export const SpecializationsResponse = CursorPaginatedResponse(Specialization)
export const QualificationKindsResponse = CursorPaginatedResponse(QualificationKind)
export const QualificationScopesResponse = CursorPaginatedResponse(QualificationScope)

export const ResolvedPathResponse = Schema.Struct({
  path: Schema.NullOr(QualificationPath),
})
