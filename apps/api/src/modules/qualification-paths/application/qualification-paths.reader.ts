import type { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  PathSelection,
  QualificationKind,
  QualificationPath,
  QualificationScope,
  Specialization,
} from '~api/modules/qualification-paths/domain/qualification-path.model.js'

import type { QualificationPathsReadError } from './errors.js'

export class QualificationPathsReader extends Context.Service<
  QualificationPathsReader,
  {
    readonly specializations: (
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<Specialization>, QualificationPathsReadError | InvalidCursor>
    readonly kinds: (
      specializationId: SpecializationId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<QualificationKind>, QualificationPathsReadError | InvalidCursor>
    readonly scopes: (
      specializationId: SpecializationId,
      kindId: QualificationKindId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<QualificationScope>, QualificationPathsReadError | InvalidCursor>
    readonly resolve: (
      selection: PathSelection,
    ) => Effect.Effect<Option.Option<QualificationPath>, QualificationPathsReadError>
  }
>()('api/modules/qualification-paths/QualificationPathsReader') {}
