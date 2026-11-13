import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'

import { requirePathAccess } from './path-access.policy.js'
import { PreparationReader } from './preparation.reader.js'

export const getGoalHistory = Effect.fn('Preparation.getGoalHistory')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId)

  const preparationReader = yield* PreparationReader

  return yield* preparationReader.goals(userId, pathId, page)
})
