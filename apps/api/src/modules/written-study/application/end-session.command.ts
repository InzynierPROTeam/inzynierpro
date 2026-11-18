import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { grantLearningRewards } from '~api/modules/learning-xp/application/award-xp.service.js'
import {
  LearningAchievement,
  noLearningRewards,
} from '~api/modules/learning-xp/domain/learning-reward.model.js'
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
      const { goal } = yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
      const session = yield* studyReader.session(userId, pathId, sessionId)

      if (Option.isNone(session)) {
        return yield* new StudySessionMissing()
      }

      if (Option.isSome(session.value.endedAt)) {
        return { session: session.value, rewards: noLearningRewards }
      }

      const ended = yield* studyRepository.endSession(sessionId)

      const rewards = yield* grantLearningRewards(
        { userId, pathId, examSessionId: goal.examSessionId, at: yield* DateTime.now },
        ended.answeredCount > 0 ? [LearningAchievement.FinishedSession()] : [],
      )

      return { session: ended, rewards }
    }),
  )
})
