import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralKnowledgeCheckOptionId } from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralQuizCheckPosition } from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import {
  awardXp,
  grantLearningRewards,
} from '~api/modules/learning-xp/application/award-xp.service.js'
import { noLearningRewards } from '~api/modules/learning-xp/domain/learning-reward.model.js'
import { reachedStreakAchievements } from '~api/modules/learning-xp/domain/learning-reward.rules.js'
import { quizCheckXpReason } from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { ReviewScheduler } from '~api/modules/learning/application/review-scheduler.service.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { OralSessionQuizReader } from '~api/modules/oral-study/application/oral-session-quiz.reader.js'
import { OralSessionQuizRepository } from '~api/modules/oral-study/application/oral-session-quiz.repository.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import {
  OralQuizCheckAlreadyChecked,
  OralQuizCheckMissing,
  OralQuizSelectionNotAllowed,
} from '~api/modules/oral-study/domain/errors.js'
import {
  OralReviewEvidence,
  oralReviewRulesVersion,
} from '~api/modules/oral-study/domain/oral-review-state.model.js'
import type { OralQuizCheck } from '~api/modules/oral-study/domain/oral-session-quiz.model.js'
import {
  isAllowedSelection,
  isCorrectSelection,
  knowledgeCheckReviewRating,
} from '~api/modules/oral-study/domain/oral-session-quiz.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { recordStreakAnswers } from '~api/modules/streak/application/streak-activity.service.js'

import { quizCheckXp } from '../domain/oral-xp.rules.js'

const sameSelection = (
  stored: ReadonlyArray<OralKnowledgeCheckOptionId>,
  submitted: ReadonlyArray<OralKnowledgeCheckOptionId>,
) => stored.length === submitted.length && submitted.every(optionId => stored.includes(optionId))

const applyQuizEvidence = Effect.fn('Study.applyQuizEvidence')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  check: OralQuizCheck,
  isCorrect: boolean,
  answeredAt: DateTime.Utc,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const reviewScheduler = yield* ReviewScheduler

  const rating = knowledgeCheckReviewRating({
    isCorrect,
    answersCurrentContent: yield* oralStudyReader.carriesCurrentContent(check.oralRevisionId),
  })

  if (Option.isNone(rating)) {
    return
  }

  const card = yield* oralStudyReader.reviewState(userId, pathId, check.questionId)

  yield* oralStudyRepository.storeReviewState({
    userId,
    qualificationPathId: pathId,
    questionId: check.questionId,
    oralRevisionId: check.oralRevisionId,
    evidence: OralReviewEvidence.QuizAnswer({ quizId: check.quizId, position: check.position }),
    rulesVersion: oralReviewRulesVersion,
    card: reviewScheduler.review(check.questionId, card, rating.value, answeredAt),
  })
})

export const answerOralQuizCheck = Effect.fn('Study.answerOralQuizCheck')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  position: OralQuizCheckPosition,
  optionIds: ReadonlyArray<OralKnowledgeCheckOptionId>,
) {
  const oralSessionQuizReader = yield* OralSessionQuizReader
  const oralSessionQuizRepository = yield* OralSessionQuizRepository
  const preparationRepository = yield* PreparationRepository

  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
      const found = yield* oralSessionQuizReader.check(userId, pathId, sessionId, position)

      if (Option.isNone(found)) {
        return yield* new OralQuizCheckMissing()
      }

      const check = found.value
      let rewards = noLearningRewards

      if (Option.isSome(check.answer)) {
        if (!sameSelection(check.answer.value.selectedOptionIds, optionIds)) {
          return yield* new OralQuizCheckAlreadyChecked()
        }
      } else {
        if (!isAllowedSelection(check.format, check.options, optionIds)) {
          return yield* new OralQuizSelectionNotAllowed()
        }

        const isCorrect = isCorrectSelection(check.options, optionIds)
        const answeredAt = yield* DateTime.now

        const earnedXp = yield* awardXp({
          userId,
          pathId,
          examSessionId: goal.examSessionId,
          reason: quizCheckXpReason,
          amount: quizCheckXp(isCorrect),
          awardKey: `quiz:${check.quizId}:${position}`,
          awardedAt: answeredAt,
        })

        yield* oralSessionQuizRepository.recordAnswer(check.quizId, position, {
          earnedXp,
          selectedOptionIds: optionIds,
          isCorrect,
          answeredAt,
        })
        yield* oralSessionQuizRepository.recordCheckStatistic({
          knowledgeCheckRevisionId: check.knowledgeCheckRevisionId,
          isCorrect,
          studyDay: studyDayOf(answeredAt).start,
        })
        yield* applyQuizEvidence(userId, pathId, check, isCorrect, answeredAt)
        const streak = yield* recordStreakAnswers(userId, answeredAt, DailyAnswerCount.make(1))

        rewards = yield* grantLearningRewards(
          { userId, pathId, examSessionId: goal.examSessionId, at: answeredAt },
          reachedStreakAchievements(streak),
        )
      }

      const result = Option.all({
        check: yield* oralSessionQuizReader.check(userId, pathId, sessionId, position),
        quiz: yield* oralSessionQuizReader.quiz(userId, pathId, sessionId),
      })

      if (Option.isNone(result)) {
        return yield* new OralQuizCheckMissing()
      }

      return { ...result.value, rewards }
    }),
  )
})
