import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'

import { requirePathAccess } from './path-access.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const archivePath = Effect.fn('Preparation.archivePath')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, { includeArchived: true })

      if (!assignment.archived) {
        yield* preparationRepository.archive(userId, pathId)
      }

      return { qualificationPathId: pathId, existing: true, archived: true }
    }),
  )
})
