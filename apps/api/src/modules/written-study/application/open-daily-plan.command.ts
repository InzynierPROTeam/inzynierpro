import type { UserId } from '@inzpro/domain/modules/identity/user'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { currentDailyPlan } from '~api/modules/written-study/application/daily-plan.service.js'

export const openDailyPlan = Effect.fn('Study.openDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })

      return yield* currentDailyPlan(userId, pathId, goal.writtenAt, yield* DateTime.now)
    }),
  )
})
