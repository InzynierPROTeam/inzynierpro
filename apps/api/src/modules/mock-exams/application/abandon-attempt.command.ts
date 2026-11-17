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
import {
  endLockedAttempt,
  lockAttemptForEnding,
} from '~api/modules/mock-exams/application/attempt-ending.service.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamAttemptNotInProgress } from '~api/modules/mock-exams/domain/errors.js'
import {
  attemptEnding,
  isDueToExpire,
} from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const abandonAttempt = Effect.fn('MockExams.abandonAttempt')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const transaction = yield* Transaction

  const attempt = yield* transaction.run(
    Effect.gen(function* () {
      const clock = yield* lockAttemptForEnding(userId, pathId, attemptId)

      if (Option.isNone(clock)) {
        return Option.none()
      }

      const now = yield* DateTime.now

      if (isDueToExpire(clock.value, now)) {
        yield* endLockedAttempt(userId, pathId, attemptId, clock.value, now)
      } else if (
        clock.value.status !== abandonedAttempt &&
        clock.value.status !== finishedAttempt
      ) {
        yield* mockExamRepository.abandonAttempt(attemptId, attemptEnding(clock.value, now))
      }

      return yield* mockExamReader.attempt(userId, pathId, attemptId)
    }),
  )

  if (Option.isSome(attempt) && attempt.value.status === finishedAttempt) {
    return yield* new MockExamAttemptNotInProgress()
  }

  return attempt
})
