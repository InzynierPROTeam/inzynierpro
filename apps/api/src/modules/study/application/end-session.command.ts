import type { UserId } from '@inzpro/domain/modules/identity/user'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudySessionMissing } from '~api/modules/study/domain/errors.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Ends the learner's session, which opens its summary: "Zobacz podsumowanie" after the last
 * question or "Zakończ sesję" at any point. An ended session accepts no answers, and a new one can
 * be configured for its document ("Start over", ADR-0002). Its answers, LearningEvents and coverage
 * stay. Ending an ended session returns it unchanged. The
 * account lock orders it against a concurrent answer, so an answer either lands before the end or
 * is refused after it.
 */
export const endSession = Effect.fn('Study.endSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, writtenExamAccess)
      const session = yield* studyReader.session(userId, pathId, sessionId)

      if (Option.isNone(session)) {
        return yield* new StudySessionMissing()
      }

      if (Option.isSome(session.value.endedAt)) {
        return session.value
      }

      return yield* studyRepository.endSession(sessionId)
    }),
  )
})
