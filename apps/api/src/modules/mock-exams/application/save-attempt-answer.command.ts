import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  type AttemptQuestionPosition,
  type AttemptQuestionVersion,
  type MockExamAttemptId,
  nextAttemptQuestionVersion,
  pausedAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { finishAttemptIfExpired } from '~api/modules/mock-exams/application/expire-attempt.command.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import {
  AttemptQuestionConflict,
  AttemptQuestionNotFound,
  MockExamAttemptNotInProgress,
  MockExamAttemptPaused,
  AttemptQuestionWithdrawn,
  InvalidAttemptAnswer,
} from '~api/modules/mock-exams/domain/errors.js'
import type { AttemptQuestion } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import { acceptsDraftWrites } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const saveAttemptAnswer = Effect.fn('MockExams.saveAttemptAnswer')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
  position: AttemptQuestionPosition,
  change: { readonly answerId: QuestionAnswerId; readonly expectedVersion: AttemptQuestionVersion },
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const transaction = yield* Transaction

  yield* finishAttemptIfExpired(userId, pathId, attemptId)

  return yield* transaction.run(
    Effect.gen(function* () {
      const clock = yield* mockExamRepository.lockAttempt(userId, pathId, attemptId)

      if (Option.isNone(clock)) {
        return yield* new AttemptQuestionNotFound()
      }

      if (clock.value.status === pausedAttempt) {
        return yield* new MockExamAttemptPaused()
      }

      if (!acceptsDraftWrites(clock.value, yield* DateTime.now)) {
        return yield* new MockExamAttemptNotInProgress()
      }

      const found = yield* mockExamReader.attemptQuestion(userId, pathId, attemptId, position)

      if (Option.isNone(found)) {
        return yield* new AttemptQuestionNotFound()
      }

      const question = found.value

      if (question.isWithdrawn) {
        return yield* new AttemptQuestionWithdrawn()
      }

      if (!question.answers.some(answer => answer.id === change.answerId)) {
        return yield* new InvalidAttemptAnswer()
      }

      if (Option.contains(question.selectedAnswerId, change.answerId)) {
        return question
      }

      if (change.expectedVersion !== question.version) {
        return yield* new AttemptQuestionConflict({ current: question })
      }

      const version = nextAttemptQuestionVersion(question.version)
      yield* mockExamRepository.saveAttemptAnswer(attemptId, position, change.answerId, version)

      return {
        ...question,
        selectedAnswerId: Option.some(change.answerId),
        version,
      } satisfies AttemptQuestion
    }),
  )
})
