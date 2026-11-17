import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

export const getSessionSummary = Effect.fn('Study.getSessionSummary')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const session = yield* studyReader.session(userId, pathId, sessionId)

  if (Option.isNone(session) || Option.isNone(session.value.endedAt)) {
    return Option.none()
  }

  const result = yield* studyReader.sessionResultCounts(sessionId)

  return Option.some({ session: session.value, result })
})
