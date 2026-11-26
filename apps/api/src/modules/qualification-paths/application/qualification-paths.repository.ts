import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'

import type { QualificationPathsWriteError } from './errors.js'

export class QualificationPathsRepository extends Context.Service<
  QualificationPathsRepository,
  {
    readonly lock: (id: QualificationPathId) => Effect.Effect<void, QualificationPathsWriteError>
    readonly lockExclusively: (
      id: QualificationPathId,
    ) => Effect.Effect<void, QualificationPathsWriteError>
  }
>()('api/modules/qualification-paths/QualificationPathsRepository') {}
