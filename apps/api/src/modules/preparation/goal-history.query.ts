import type { CursorPagination } from '@inzpro/domain/common/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'
import { PreparationReader } from '~api/modules/preparation/preparation.reader.js'

export const getGoalHistory = Effect.fn('Preparation.getGoalHistory')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPagination,
) {
  yield* requirePathAccess(userId, pathId)

  const preparationReader = yield* PreparationReader

  return yield* preparationReader.goals(userId, pathId, page)
})
