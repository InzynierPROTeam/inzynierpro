import type { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { type DateTime, Effect, Option } from 'effect'
import {
  awardXp,
  grantLearningRewards,
} from '~api/modules/learning-xp/application/award-xp.service.js'
import {
  LearningAchievement,
  noLearningRewards,
} from '~api/modules/learning-xp/domain/learning-reward.model.js'
import { reachedStreakAchievements } from '~api/modules/learning-xp/domain/learning-reward.rules.js'
import {
  examAnswerXpReason,
  finishedExamXpReason,
} from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { examMode } from '~api/modules/learning/domain/review-state.model.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import type { AttemptClock } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import { scoreAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.rules.js'
import { attemptEnding } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
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

import {
  finalExamAnswerXp,
  finishedExamXp,
  finishedExamDailyLimit,
} from '../domain/mock-exam-xp.rules.js'

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
    return noLearningRewards
  }

  const ending = attemptEnding(clock, now)

  const result = scoreAttempt(score.value, ending)

  const { goal } = yield* requirePathAccess(userId, pathId, { includeArchived: true })
  let earnedXp = LearningXp.make(0)

  const finalAnswers = yield* mockExamReader.finalAnswers(attemptId)

  for (const answer of finalAnswers) {
    const awarded = yield* awardXp({
      userId,
      pathId,
      examSessionId: goal.examSessionId,
      reason: examAnswerXpReason,
      amount: finalExamAnswerXp(answer.isCorrect),
      awardKey: `exam:${attemptId}:${answer.questionId}`,
      awardedAt: ending.finishedAt,
    })

    earnedXp = LearningXp.make(earnedXp + awarded)
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

  const awarded = yield* awardXp(
    {
      userId,
      pathId,
      examSessionId: goal.examSessionId,
      reason: finishedExamXpReason,
      amount: finishedExamXp(Option.getOrElse(result.passed, () => false)),
      awardKey: `exam-finished:${attemptId}`,
      awardedAt: ending.finishedAt,
    },
    finishedExamDailyLimit,
  )

  earnedXp = LearningXp.make(earnedXp + awarded)

  yield* mockExamRepository.finishAttempt(attemptId, ending, result, earnedXp)

  const passed = Option.getOrElse(result.passed, () => false)

  if (passed) {
    yield* grantStreakBridges(userId, passedMockExamBridgeOf(ending.finishedAt))
  }

  const streak = yield* recordStreakAnswers(
    userId,
    ending.finishedAt,
    DailyAnswerCount.make(finalAnswers.length),
  )

  return yield* grantLearningRewards(
    { userId, pathId, examSessionId: goal.examSessionId, at: ending.finishedAt },
    [
      ...(passed ? [LearningAchievement.PassedMockExam()] : []),
      ...reachedStreakAchievements(streak),
    ],
  )
})
