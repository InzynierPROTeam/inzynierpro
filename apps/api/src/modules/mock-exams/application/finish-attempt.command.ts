import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  ExamActiveSeconds,
  finishedAttempt,
  type MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Duration, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamAttemptNotInProgress } from '~api/modules/mock-exams/domain/errors.js'
import { scoreAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.rules.js'
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
      const status = yield* mockExamRepository.lockAttempt(userId, pathId, attemptId)

      if (Option.isNone(status)) {
        return Option.none()
      }

      const attempt = yield* mockExamReader.attempt(userId, pathId, attemptId)

      if (Option.isNone(attempt) || status.value === finishedAttempt) {
        return attempt
      }

      if (status.value !== 'in-progress' && status.value !== 'paused') {
        return yield* new MockExamAttemptNotInProgress()
      }

      const score = yield* mockExamReader.scoreAttempt(userId, pathId, attemptId)

      if (Option.isNone(score)) {
        return Option.none()
      }

      const now = yield* DateTime.now

      const activeSeconds = ExamActiveSeconds.make(
        Math.max(
          0,
          Math.floor(Duration.toSeconds(DateTime.distance(attempt.value.startedAt, now))),
        ),
      )

      yield* mockExamRepository.finishAttempt(
        attemptId,
        now,
        scoreAttempt(score.value, activeSeconds),
      )

      return yield* mockExamReader.attempt(userId, pathId, attemptId)
    }),
  )
})
