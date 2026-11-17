import type { UserId } from '@inzpro/domain/modules/identity/user'
import { bothExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { nextUserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'

import { requirePathAccess } from './path-access.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const extendPath = Effect.fn('Preparation.extendPath')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const path = yield* requirePathAccess(userId, pathId)

      if (path.accessScope !== bothExamAccess) {
        yield* preparationRepository.extend(userId, pathId)
        yield* preparationRepository.appendGoal(
          userId,
          pathId,
          nextUserExamGoalVersion(path.goal.version),
          path.goal.examSessionId,
          bothExamAccess,
          path.goal.oralExamDate,
        )
      }

      return { qualificationPathId: pathId, existing: true, archived: false }
    }),
  )
})
