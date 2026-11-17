import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

export const getSessionResults = Effect.fn('Study.getSessionResults')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const session = yield* studyReader.session(userId, pathId, sessionId)

  if (Option.isNone(session) || Option.isNone(session.value.endedAt)) {
    return { data: [], meta: { hasMore: false } }
  }

  return yield* studyReader.sessionResults(userId, pathId, sessionId, page)
})
