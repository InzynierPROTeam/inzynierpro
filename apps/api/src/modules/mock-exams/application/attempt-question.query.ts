import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  type AttemptQuestionPosition,
  type MockExamAttemptId,
  pausedAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamAttemptPaused } from '~api/modules/mock-exams/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const getAttemptQuestion = Effect.fn('MockExams.getAttemptQuestion')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
  position: AttemptQuestionPosition,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader

  const status = yield* mockExamReader.attemptStatus(userId, pathId, attemptId)

  if (Option.contains(status, pausedAttempt)) {
    return yield* new MockExamAttemptPaused()
  }

  return yield* mockExamReader.attemptQuestion(userId, pathId, attemptId, position)
})
