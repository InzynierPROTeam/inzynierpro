import type { CursorPagination, CursorPage, InvalidCursor } from '@inzpro/domain/common/pagination'
import type { PathFilters } from '@inzpro/domain/modules/preparation/onboarding'
import type {
  QualificationKind,
  QualificationKindId,
} from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { QualificationPath } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QualificationScope } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import type {
  Specialization,
  SpecializationId,
} from '@inzpro/domain/modules/qualification-paths/specialization'
import { Context, type Effect, type Option } from 'effect'

import type { QualificationPathsReadError } from './errors.js'

export class QualificationPathsReader extends Context.Service<
  QualificationPathsReader,
  {
    readonly specializations: (
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<Specialization>, QualificationPathsReadError | InvalidCursor>
    readonly kinds: (
      specializationId: SpecializationId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<QualificationKind>, QualificationPathsReadError | InvalidCursor>
    readonly scopes: (
      specializationId: SpecializationId,
      kindId: QualificationKindId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<QualificationScope>, QualificationPathsReadError | InvalidCursor>
    readonly resolve: (
      filters: Required<PathFilters>,
    ) => Effect.Effect<Option.Option<QualificationPath>, QualificationPathsReadError>
  }
>()('api/modules/qualification-paths/QualificationPathsReader') {}
