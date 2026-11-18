import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import {
  favoritesStudySession,
  regularStudySession,
  reviewStudySession,
  type SessionQuestionPosition,
  type StudySessionId,
  type StudySessionKind,
} from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { closesPlannedRound } from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import {
  awardXp,
  grantLearningRewards,
} from '~api/modules/learning-xp/application/award-xp.service.js'
import {
  LearningAchievement,
  noLearningRewards,
} from '~api/modules/learning-xp/domain/learning-reward.model.js'
import { reachedStreakAchievements } from '~api/modules/learning-xp/domain/learning-reward.rules.js'
import { writtenAnswerXpReason } from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { xpStudyDate } from '~api/modules/learning-xp/domain/learning-xp.rules.js'
import {
  QuestionRevisionWithdrawn,
  SessionAlreadyEnded,
  SessionQuestionMissing,
} from '~api/modules/learning/domain/errors.js'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import {
  favoritesMode,
  type LearningMode,
  reviewMode,
  studyMode,
} from '~api/modules/learning/domain/review-state.model.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  grantStreakBridges,
  recordStreakAnswers,
} from '~api/modules/streak/application/streak-activity.service.js'
import { completedRoundBridgeOf } from '~api/modules/streak/domain/streak.rules.js'
import {
  recordDailyPlanAnswer,
  prepareDailyPlan,
} from '~api/modules/written-study/application/daily-plan.service.js'
import { recordWrittenEvidence } from '~api/modules/written-study/application/review-state.service.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import {
  AnswerNotInQuestion,
  QuestionAlreadyAnswered,
} from '~api/modules/written-study/domain/errors.js'
import {
  noAssistance,
  WrittenEvidenceSource,
} from '~api/modules/written-study/domain/review-state.model.js'
import { answerAssistance } from '~api/modules/written-study/domain/review-state.rules.js'
import { writtenAnswerXp } from '~api/modules/written-study/domain/written-xp.rules.js'

const syncLearningRound = Effect.fn('Study.syncLearningRound')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const progress = yield* studyReader.learningRound(userId, pathId)
  const round = currentLearningRound(progress)

  if (round !== progress.round) {
    yield* studyRepository.storeLearningRound(userId, pathId, round)
  }

  return round
})

const sessionLearningModes = {
  [regularStudySession]: studyMode,
  [reviewStudySession]: reviewMode,
  [favoritesStudySession]: favoritesMode,
} satisfies Record<StudySessionKind, LearningMode>

export const submitAnswer = Effect.fn('Study.submitAnswer')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })

      const found = Option.all({
        session: yield* studyReader.session(userId, pathId, sessionId),
        question: yield* studyReader.sessionQuestion(userId, pathId, sessionId, position),
      })

      if (Option.isNone(found)) {
        return yield* new SessionQuestionMissing()
      }

      const { session, question } = found.value

      if (Option.isSome(question.answer)) {
        if (question.answer.value.answerId === answerId) {
          return {
            question,
            session,
            awardedXp: LearningXp.make(0),
            rewards: noLearningRewards,
          }
        }

        return yield* new QuestionAlreadyAnswered()
      }

      if (Option.isSome(session.endedAt)) {
        return yield* new SessionAlreadyEnded()
      }

      const option = question.answers.find(({ id }) => id === answerId)

      if (question.questionRevisionId !== questionRevisionId || option === undefined) {
        return yield* new AnswerNotInQuestion()
      }

      if (question.isWithdrawn) {
        return yield* new QuestionRevisionWithdrawn()
      }

      const answeredAt = yield* DateTime.now
      const assistance = answerAssistance(question)

      const answer = {
        userId,
        qualificationPathId: pathId,
        goalVersion: session.goalVersion,
        sessionId,
        position,
        questionId: question.questionId,
        questionRevisionId,
        answerId,
        isCorrect: option.isCorrect,
        isAssisted: assistance !== noAssistance,
      }

      const reviewCard = yield* studyReader.reviewState(userId, pathId, question.questionId)

      const isDueReview =
        session.kind === reviewStudySession &&
        Option.isSome(reviewCard) &&
        DateTime.isLessThanOrEqualTo(reviewCard.value.dueAt, answeredAt)

      const awardedXp = yield* awardXp({
        reason: writtenAnswerXpReason,
        userId,
        pathId,
        examSessionId: goal.examSessionId,
        amount: writtenAnswerXp({ isCorrect: option.isCorrect, assistance, isDueReview }),
        awardKey: `written:${question.questionId}:${xpStudyDate(answeredAt)}`,
        awardedAt: answeredAt,
      })

      const stored = yield* studyRepository.recordAnswer(answer)
      const isRegularStudy = session.kind === regularStudySession
      const achievements: Array<LearningAchievement> = []

      yield* recordWrittenEvidence(
        {
          userId,
          qualificationPathId: pathId,
          goalVersion: session.goalVersion,
          questionId: question.questionId,
          questionRevisionId,
          isCorrect: option.isCorrect,
          source: WrittenEvidenceSource.StudySessionAnswer({ sessionId, position }),
        },
        {
          mode: sessionLearningModes[session.kind],
          assistance,
          answeredAt,
        },
      )

      if (isRegularStudy) {
        const round = yield* syncLearningRound(userId, pathId)
        const before = yield* studyReader.learningRound(userId, pathId)
        yield* prepareDailyPlan(userId, pathId, goal.writtenAt, before, answeredAt)
        yield* studyRepository.recordCoverage(
          userId,
          pathId,
          question.questionId,
          questionRevisionId,
          round,
        )
        const after = yield* studyReader.learningRound(userId, pathId)
        yield* recordDailyPlanAnswer(userId, pathId, answeredAt, { before, after })

        if (closesPlannedRound({ before, after })) {
          yield* grantStreakBridges(
            userId,
            completedRoundBridgeOf(pathId, writtenExamAccess, after.round, answeredAt),
          )
          achievements.push(
            LearningAchievement.CompletedRound({ part: writtenExamAccess, round: after.round }),
          )
        }

        yield* syncLearningRound(userId, pathId)
      }

      const streak = yield* recordStreakAnswers(userId, answeredAt, DailyAnswerCount.make(1))

      const rewards = yield* grantLearningRewards(
        { userId, pathId, examSessionId: goal.examSessionId, at: answeredAt },
        [...achievements, ...reachedStreakAchievements(streak)],
      )

      const next = yield* studyReader.nextOpenPosition(sessionId, position)

      const moved = yield* studyRepository.moveSession(
        sessionId,
        Option.getOrElse(next, () => position),
      )

      return {
        question: { ...question, answer: Option.some(stored) },
        session: moved,
        awardedXp,
        rewards,
      }
    }),
  )
})
