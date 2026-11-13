import { CursorPaginatedResponse } from '@inzpro/domain/common/pagination'
import { QualificationKind } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationPath } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { QualificationScope } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { Specialization } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'

export const SpecializationsResponse = CursorPaginatedResponse(Specialization)
export const QualificationKindsResponse = CursorPaginatedResponse(QualificationKind)
export const QualificationScopesResponse = CursorPaginatedResponse(QualificationScope)

export const ResolvedPathResponse = Schema.Struct({
  path: Schema.NullOr(QualificationPath),
})
