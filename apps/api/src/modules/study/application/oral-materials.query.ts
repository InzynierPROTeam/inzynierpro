import type { UserId } from '@inzpro/domain/modules/identity/user'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Schema } from 'effect'
import { type CursorPageRequest, decodeCursor } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

// TODO(#6): query published oral categories once the oral dataset is imported.
export const getOralMaterials = Effect.fn('Study.getOralMaterials')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, 'oral')
  yield* decodeCursor(Schema.Struct({ id: OralQuestionCategoryId }), page.cursor)

  return { data: [], meta: { hasMore: false } }
})
