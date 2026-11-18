import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { type DateTime, Effect, Option } from 'effect'
import { examMode } from '~api/modules/learning/domain/review-state.model.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import type { AttemptClock } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import { scoreAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.rules.js'
import { attemptEnding } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  grantStreakBridges,
  recordStreakAnswers,
} from '~api/modules/streak/application/streak-activity.service.js'
import { passedMockExamBridgeOf } from '~api/modules/streak/domain/streak.rules.js'
import { recordWrittenEvidence } from '~api/modules/written-study/application/review-state.service.js'
import {
  noAssistance,
  WrittenEvidenceSource,
} from '~api/modules/written-study/domain/review-state.model.js'

export const lockAttemptForEnding = Effect.fn('MockExams.lockAttemptForEnding')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  attemptId: MockExamAttemptId,
) {
  const preparationRepository = yield* PreparationRepository
  const mockExamRepository = yield* MockExamRepository

  yield* preparationRepository.lockUser(userId)

  return yield* mockExamRepository.lockAttempt(userId, pathId, attemptId)
})

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

  const result = scoreAttempt(score.value, ending)

  yield* mockExamRepository.finishAttempt(attemptId, ending, result)

  const finalAnswers = yield* mockExamReader.finalAnswers(attemptId)

  for (const answer of finalAnswers) {
    yield* recordWrittenEvidence(
      {
        userId,
        qualificationPathId: pathId,
        goalVersion: answer.goalVersion,
        questionId: answer.questionId,
        questionRevisionId: answer.questionRevisionId,
        isCorrect: answer.isCorrect,
        source: WrittenEvidenceSource.MockExamAnswer({ attemptId, position: answer.position }),
      },
      { mode: examMode, assistance: noAssistance, answeredAt: ending.finishedAt },
    )
  }

  if (Option.getOrElse(result.passed, () => false)) {
    yield* grantStreakBridges(userId, passedMockExamBridgeOf(ending.finishedAt))
  }

  yield* recordStreakAnswers(userId, ending.finishedAt, DailyAnswerCount.make(finalAnswers.length))
})
