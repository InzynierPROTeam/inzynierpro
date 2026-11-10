import type { PathFilters } from '@inzpro/domain/modules/preparation/onboarding'
import type { QualificationPath } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QualificationScope } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { Context, type Effect } from 'effect'
import type { QualificationPathsWriteError } from '~api/modules/qualification-paths/errors.js'

export class QualificationPathsRepository extends Context.Service<
  QualificationPathsRepository,
  {
    readonly createScope: (
      scope: QualificationScope,
    ) => Effect.Effect<void, QualificationPathsWriteError>
    readonly createPath: (
      path: QualificationPath & Required<PathFilters>,
    ) => Effect.Effect<void, QualificationPathsWriteError>
    readonly lock: (id: QualificationPathId) => Effect.Effect<void, QualificationPathsWriteError>
  }
>()('api/modules/qualification-paths/QualificationPathsRepository') {}
