import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'

import { requireAssignment } from './assignment.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const restorePath = Effect.fn('Preparation.restorePath')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository

  return yield* preparationRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requireAssignment(userId, pathId)
      yield* preparationRepository.restore(userId, pathId)

      return { qualificationPathId: pathId, existing: true, archived: false }
    }),
  )
})
