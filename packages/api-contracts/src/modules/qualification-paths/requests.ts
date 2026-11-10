import { CursorPagination } from '@inzpro/domain/common/pagination'
import { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'

export const SpecializationsQuery = CursorPagination

export const QualificationKindsQuery = Schema.Struct({
  ...CursorPagination.fields,
  specializationId: SpecializationId,
})

export const QualificationScopesQuery = Schema.Struct({
  ...QualificationKindsQuery.fields,
  qualificationKindId: QualificationKindId,
})

export const ResolvePathQuery = Schema.Struct({
  specializationId: SpecializationId,
  qualificationKindId: QualificationKindId,
  qualificationScopeId: QualificationScopeId,
})
