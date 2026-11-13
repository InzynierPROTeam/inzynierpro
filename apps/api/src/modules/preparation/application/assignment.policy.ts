import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { PathPermissionDenied } from '~api/modules/preparation/domain/errors.js'

import { PreparationReader } from './preparation.reader.js'

export const requireAssignment = (userId: UserId, pathId: QualificationPathId) =>
  Effect.gen(function* () {
    const preparationReader = yield* PreparationReader
    const assignment = yield* preparationReader.path(userId, pathId)

    if (Option.isNone(assignment)) {
      return yield* new PathPermissionDenied()
    }

    return assignment.value
  })
