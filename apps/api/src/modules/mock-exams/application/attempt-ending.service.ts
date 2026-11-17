import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type DateTime, Effect, Option } from 'effect'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import type { AttemptClock } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import { scoreAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.rules.js'
import { attemptEnding } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'

export const endLockedAttempt = Effect.fn('MockExams.endLockedAttempt')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
  clock: AttemptClock,
  now: DateTime.Utc,
) {
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const score = yield* mockExamReader.scoreAttempt(userId, pathId, attemptId)

  if (Option.isNone(score)) {
    return
  }

  const ending = attemptEnding(clock, now)

  yield* mockExamRepository.finishAttempt(
    attemptId,
    ending,
    scoreAttempt(score.value, ending.activeSeconds),
  )
})
