import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  abandonedAttempt,
  finishedAttempt,
  type MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { endLockedAttempt } from '~api/modules/mock-exams/application/attempt-ending.service.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamAttemptNotInProgress } from '~api/modules/mock-exams/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const finishAttempt = Effect.fn('MockExams.finishAttempt')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      const clock = yield* mockExamRepository.lockAttempt(userId, pathId, attemptId)

      if (Option.isNone(clock)) {
        return Option.none()
      }

      if (clock.value.status === abandonedAttempt) {
        return yield* new MockExamAttemptNotInProgress()
      }

      if (clock.value.status !== finishedAttempt) {
        yield* endLockedAttempt(userId, pathId, attemptId, clock.value, yield* DateTime.now)
      }

      return yield* mockExamReader.attempt(userId, pathId, attemptId)
    }),
  )
})
