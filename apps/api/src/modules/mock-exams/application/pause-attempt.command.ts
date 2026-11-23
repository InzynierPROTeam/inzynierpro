import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  type MockExamAttemptId,
  pausedAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { finishAttemptIfExpired } from '~api/modules/mock-exams/application/expire-attempt.command.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamAttemptNotInProgress } from '~api/modules/mock-exams/domain/errors.js'
import { acceptsPause } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const pauseAttempt = Effect.fn('MockExams.pauseAttempt')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const preparationRepository = yield* PreparationRepository
  const transaction = yield* Transaction

  yield* finishAttemptIfExpired(userId, pathId, attemptId)

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockAssignmentForShare(userId, pathId)
      const clock = yield* mockExamRepository.lockAttempt(userId, pathId, attemptId)

      if (Option.isNone(clock)) {
        return Option.none()
      }

      if (clock.value.status !== pausedAttempt) {
        const now = yield* DateTime.now

        if (!acceptsPause(clock.value, now)) {
          return yield* new MockExamAttemptNotInProgress()
        }

        yield* mockExamRepository.pauseAttempt(attemptId, now)
      }

      return yield* mockExamReader.attempt(userId, pathId, attemptId)
    }),
  )
})
