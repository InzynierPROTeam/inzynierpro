import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  inProgressAttempt,
  type MockExamAttemptId,
  pausedAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { scheduleAttemptDeadline } from '~api/modules/mock-exams/application/attempt-deadline.job.js'
import { finishAttemptIfExpired } from '~api/modules/mock-exams/application/expire-attempt.command.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamAttemptNotInProgress } from '~api/modules/mock-exams/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const resumeAttempt = Effect.fn('MockExams.resumeAttempt')(function* (
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

      if (clock.value.status === inProgressAttempt) {
        return yield* mockExamReader.attempt(userId, pathId, attemptId)
      }

      if (clock.value.status !== pausedAttempt) {
        return yield* new MockExamAttemptNotInProgress()
      }

      yield* mockExamRepository.resumeAttempt(attemptId, yield* DateTime.now)
      const attempt = yield* mockExamReader.attempt(userId, pathId, attemptId)

      if (Option.isSome(attempt)) {
        yield* scheduleAttemptDeadline({
          attemptId,
          userId,
          qualificationPathId: pathId,
          deadline: attempt.value.deadline,
        })
      }

      return attempt
    }),
  )
})
