import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const getLatestOralSession = Effect.fn('Study.getLatestOralSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
) {
  yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader

  return yield* oralStudyReader.latestSession(userId, pathId, categoryId)
})

export const getOralSession = Effect.fn('Study.getOralSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
) {
  yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader

  return yield* oralStudyReader.session(userId, pathId, sessionId)
})

export const getOralSessionQuestion = Effect.fn('Study.getOralSessionQuestion')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  position: SessionQuestionPosition,
) {
  const { districtChamber } = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader

  return yield* oralStudyReader.sessionQuestion(
    userId,
    pathId,
    sessionId,
    position,
    Option.map(districtChamber, ({ id }) => id),
  )
})

export const getOralSessionSummary = Effect.fn('Study.getOralSessionSummary')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
) {
  yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader
  const session = yield* oralStudyReader.session(userId, pathId, sessionId)

  if (Option.isNone(session) || Option.isNone(session.value.endedAt)) {
    return Option.none()
  }

  const result = yield* oralStudyReader.sessionResultCounts(sessionId)

  return Option.some({ session: session.value, result })
})

export const getOralSessionResults = Effect.fn('Study.getOralSessionResults')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader
  const session = yield* oralStudyReader.session(userId, pathId, sessionId)

  if (Option.isNone(session) || Option.isNone(session.value.endedAt)) {
    return { data: [], meta: { hasMore: false } }
  }

  return yield* oralStudyReader.sessionResults(userId, pathId, sessionId, page)
})
