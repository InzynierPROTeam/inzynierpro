import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { grantLearningRewards } from '~api/modules/learning-xp/application/award-xp.service.js'
import {
  LearningAchievement,
  noLearningRewards,
} from '~api/modules/learning-xp/domain/learning-reward.model.js'
import { StudySessionMissing } from '~api/modules/learning/domain/errors.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const endOralSession = Effect.fn('Study.endOralSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
      const session = yield* oralStudyReader.session(userId, pathId, sessionId)

      if (Option.isNone(session)) {
        return yield* new StudySessionMissing()
      }

      if (Option.isSome(session.value.endedAt)) {
        return { session: session.value, rewards: noLearningRewards }
      }

      const ended = yield* oralStudyRepository.endSession(sessionId)

      const rewards = yield* grantLearningRewards(
        { userId, pathId, examSessionId: goal.examSessionId, at: yield* DateTime.now },
        ended.answeredCount > 0 ? [LearningAchievement.FinishedSession()] : [],
      )

      return { session: ended, rewards }
    }),
  )
})
