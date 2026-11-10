import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'

import { requirePathAccess } from './path-access.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const selectPath = (userId: UserId, pathId: QualificationPathId) =>
  Effect.gen(function* () {
    const preparationRepository = yield* PreparationRepository

    return yield* preparationRepository.transaction(
      Effect.gen(function* () {
        yield* preparationRepository.lockUser(userId)
        yield* requirePathAccess(userId, pathId)
        yield* preparationRepository.select(userId, pathId)

        return { qualificationPathId: pathId, existing: true, archived: false }
      }),
    )
  })
