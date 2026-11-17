import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const getMockExamAttempt = Effect.fn('MockExams.getMockExamAttempt')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader

  return yield* mockExamReader.attempt(userId, pathId, attemptId)
})
