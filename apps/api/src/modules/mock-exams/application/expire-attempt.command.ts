import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { endLockedAttempt } from '~api/modules/mock-exams/application/attempt-ending.service.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { isDueToExpire } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const finishAttemptIfExpired = Effect.fn('MockExams.finishAttemptIfExpired')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  const mockExamRepository = yield* MockExamRepository
  const transaction = yield* Transaction

  yield* transaction.run(
    Effect.gen(function* () {
      const clock = yield* mockExamRepository.lockAttempt(userId, pathId, attemptId)
      const now = yield* DateTime.now

      if (Option.isSome(clock) && isDueToExpire(clock.value, now)) {
        yield* endLockedAttempt(userId, pathId, attemptId, clock.value, now)
      }
    }),
  )
})

export const expireAttemptBeforeRead = Effect.fn('MockExams.expireAttemptBeforeRead')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  yield* finishAttemptIfExpired(userId, pathId, attemptId)
})

export const expireUnfinishedAttemptBeforeRead = Effect.fn(
  'MockExams.expireUnfinishedAttemptBeforeRead',
)(function* (userId: UserId, pathId: QualificationPathId) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader
  const unfinished = yield* mockExamReader.unfinishedAttempt(userId, pathId)

  if (Option.isSome(unfinished)) {
    yield* finishAttemptIfExpired(userId, pathId, unfinished.value.id)
  }
})
