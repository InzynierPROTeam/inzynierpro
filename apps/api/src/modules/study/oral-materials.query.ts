import type { CursorPagination } from '@inzpro/domain/common/pagination'
import { decodeCursor } from '@inzpro/domain/common/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'

// TODO(#6): query published oral categories once the oral dataset is imported.
export const getOralMaterials = (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPagination,
) =>
  Effect.gen(function* () {
    yield* requirePathAccess(userId, pathId, 'oral')
    yield* decodeCursor(OralQuestionCategoryId, page.cursor)

    return { data: [], meta: { hasMore: false } }
  })
