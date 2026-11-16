import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { StudyReader } from './study.reader.js'

export const getOralMaterials = Effect.fn('Study.getOralMaterials')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, 'oral')

  const studyReader = yield* StudyReader

  return yield* studyReader.oralCategories(userId, pathId, page)
})
