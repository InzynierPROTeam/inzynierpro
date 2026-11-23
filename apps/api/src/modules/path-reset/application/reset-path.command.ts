import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { StaleUserQualificationPath } from '~api/modules/path-reset/domain/errors.js'
import type { PathReset } from '~api/modules/path-reset/domain/path-reset.model.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const resetPath = Effect.fn('PathReset.resetPath')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  expectedVersion: UserQualificationPathVersion,
) {
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository
  const studyRepository = yield* StudyRepository
  const oralStudyRepository = yield* OralStudyRepository
  const mockExamRepository = yield* MockExamRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* preparationRepository.lockAssignmentForUpdate(userId, pathId)
      const assignment = yield* requirePathAccess(userId, pathId, { includeArchived: true })

      if (expectedVersion !== assignment.version) {
        return yield* new StaleUserQualificationPath()
      }

      yield* mockExamRepository.resetPath(userId, pathId)
      yield* studyRepository.resetPath(userId, pathId)
      yield* oralStudyRepository.resetPath(userId, pathId)

      return {
        qualificationPathId: pathId,
        version: yield* preparationRepository.advanceVersion(userId, pathId),
      } satisfies PathReset
    }),
  )
})
