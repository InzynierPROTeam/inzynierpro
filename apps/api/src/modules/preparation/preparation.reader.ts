import type { CursorPage, CursorPagination, InvalidCursor } from '@inzpro/domain/common/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { UserExamGoal } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { UserQualificationPath } from '@inzpro/domain/modules/preparation/user-qualification-path'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'

import type { PreparationReadError } from './errors.js'

export class PreparationReader extends Context.Service<
  PreparationReader,
  {
    readonly paths: (
      userId: UserId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<UserQualificationPath>, PreparationReadError | InvalidCursor>
    readonly path: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<UserQualificationPath>, PreparationReadError>
    readonly selectedPath: (
      userId: UserId,
    ) => Effect.Effect<Option.Option<UserQualificationPath>, PreparationReadError>
    readonly goals: (
      userId: UserId,
      pathId: QualificationPathId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<UserExamGoal>, PreparationReadError | InvalidCursor>
  }
>()('api/modules/preparation/PreparationReader') {}
