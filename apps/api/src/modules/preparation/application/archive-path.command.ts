import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'

import { requireAssignment } from './assignment.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const archivePath = Effect.fn('Preparation.archivePath')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository

  return yield* preparationRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requireAssignment(userId, pathId)

      if (!assignment.archived) {
        yield* preparationRepository.archive(userId, pathId)
      }

      return { qualificationPathId: pathId, existing: true, archived: true }
    }),
  )
})
