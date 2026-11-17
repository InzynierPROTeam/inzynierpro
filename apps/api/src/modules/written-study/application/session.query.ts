import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

export const getSession = Effect.fn('Study.getSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const studyReader = yield* StudyReader

  return yield* studyReader.session(userId, pathId, sessionId)
})
