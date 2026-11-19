import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  UserExamGoal,
  UserQualificationPath,
} from '~api/modules/preparation/domain/preparation.model.js'

import type { PreparationReadError } from './errors.js'

export class PreparationReader extends Context.Service<
  PreparationReader,
  {
    readonly hasReachedPathLimit: (userId: UserId) => Effect.Effect<boolean, PreparationReadError>
    readonly paths: (
      userId: UserId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<UserQualificationPath>, PreparationReadError | InvalidCursor>
    readonly activePaths: (
      userId: UserId,
    ) => Effect.Effect<ReadonlyArray<UserQualificationPath>, PreparationReadError>
    readonly path: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<UserQualificationPath>, PreparationReadError>
    readonly goals: (
      userId: UserId,
      pathId: QualificationPathId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<UserExamGoal>, PreparationReadError | InvalidCursor>
  }
>()('api/modules/preparation/PreparationReader') {}
