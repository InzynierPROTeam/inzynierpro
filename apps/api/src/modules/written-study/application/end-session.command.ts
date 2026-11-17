import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { StudySessionMissing } from '~api/modules/learning/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const endSession = Effect.fn('Study.endSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
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
