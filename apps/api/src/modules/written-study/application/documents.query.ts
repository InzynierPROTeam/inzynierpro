import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

export const getDocuments = Effect.fn('Study.getDocuments')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, 'written')

  const studyReader = yield* StudyReader

  const round = currentLearningRound(yield* studyReader.learningRound(userId, pathId))

  return yield* studyReader.documents(userId, pathId, round, page)
})
