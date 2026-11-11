import type { CursorPagination } from '@inzpro/domain/common/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'
import { StudyReader } from '~api/modules/study/study.reader.js'

export const getDocuments = Effect.fn('Study.getDocuments')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPagination,
) {
  yield* requirePathAccess(userId, pathId, 'written')

  const studyReader = yield* StudyReader

  return yield* studyReader.documents(userId, pathId, page)
})
