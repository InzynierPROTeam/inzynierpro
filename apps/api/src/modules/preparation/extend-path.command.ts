import type { UserId } from '@inzpro/domain/modules/identity/user'
import { bothExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { Schema } from 'effect'

import { requirePathAccess } from './path-access.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const extendPath = Effect.fn('Preparation.extendPath')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository

  return yield* preparationRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const path = yield* requirePathAccess(userId, pathId)

      if (path.accessScope !== bothExamAccess) {
        const version = Schema.decodeSync(UserExamGoalVersion)(path.goal.version + 1)
        yield* preparationRepository.extend(userId, pathId)
        yield* preparationRepository.appendGoal(
          userId,
          pathId,
          version,
          path.goal.examSessionId,
          bothExamAccess,
          path.goal.oralExamDate,
        )
      }

      return { qualificationPathId: pathId, existing: true, archived: false }
    }),
  )
})
