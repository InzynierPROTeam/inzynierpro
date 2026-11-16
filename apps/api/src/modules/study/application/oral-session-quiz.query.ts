import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { Effect, Option } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import type { OralSessionQuizState } from '~api/modules/study/domain/oral-session-quiz.model.js'

import { OralSessionQuizReader } from './oral-session-quiz.reader.js'
import { OralStudyReader } from './oral-study.reader.js'

export const getOralSessionQuizState = Effect.fn('Study.getOralSessionQuizState')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const oralSessionQuizReader = yield* OralSessionQuizReader
  const session = yield* oralStudyReader.session(userId, pathId, sessionId)

  if (Option.isNone(session)) {
    return Option.none<OralSessionQuizState>()
  }

  const quiz = yield* oralSessionQuizReader.quiz(userId, pathId, sessionId)

  const availableFormats =
    Option.isNone(quiz) && Option.isSome(session.value.endedAt)
      ? yield* oralSessionQuizReader.availableFormats(sessionId)
      : []

  return Option.some<OralSessionQuizState>({ quiz, availableFormats })
})

export const getOralQuizChecks = Effect.fn('Study.getOralQuizChecks')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralSessionQuizReader = yield* OralSessionQuizReader

  return yield* oralSessionQuizReader.checks(userId, pathId, sessionId, page)
})
