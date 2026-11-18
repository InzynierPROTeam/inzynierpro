import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { regularStudySession } from '@inzpro/domain/modules/learning/study-session'
import type {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { closesPlannedRound } from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import {
  QuestionRevisionWithdrawn,
  SessionAlreadyEnded,
  SessionQuestionMissing,
} from '~api/modules/learning/domain/errors.js'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import {
  recordOralDailyPlanAnswer,
  prepareOralDailyPlan,
} from '~api/modules/oral-study/application/oral-daily-plan.service.js'
import { recordOralEvidence } from '~api/modules/oral-study/application/oral-review-state.service.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import {
  OralQuestionAlreadyAssessed,
  OralRevisionNotInSession,
} from '~api/modules/oral-study/domain/errors.js'
import { oralExamAt } from '~api/modules/oral-study/domain/oral-exam-day.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  grantStreakBridges,
  recordStreakAnswers,
} from '~api/modules/streak/application/streak-activity.service.js'
import { completedRoundBridgeOf } from '~api/modules/streak/domain/streak.rules.js'

const syncOralLearningRound = Effect.fn('Study.syncOralLearningRound')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const progress = yield* oralStudyReader.learningRound(userId, pathId)
  const round = currentLearningRound(progress)

  if (round !== progress.round) {
    yield* oralStudyRepository.storeLearningRound(userId, pathId, round)
  }

  return round
})

export const submitOralSelfAssessment = Effect.fn('Study.submitOralSelfAssessment')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  position: SessionQuestionPosition,
  oralRevisionId: OralRevisionId,
  selfAssessment: OralSelfAssessment,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })

      const found = Option.all({
        session: yield* oralStudyReader.session(userId, pathId, sessionId),
        question: yield* oralStudyReader.sessionQuestion(userId, pathId, sessionId, position),
      })

      if (Option.isNone(found)) {
        return yield* new SessionQuestionMissing()
      }

      const { session, question } = found.value

      if (Option.isSome(question.selfAssessment)) {
        if (question.selfAssessment.value.value === selfAssessment) {
          return { question, session }
        }

        return yield* new OralQuestionAlreadyAssessed()
      }

      if (Option.isSome(session.endedAt)) {
        return yield* new SessionAlreadyEnded()
      }

      if (question.oralRevisionId !== oralRevisionId) {
        return yield* new OralRevisionNotInSession()
      }

      if (question.isWithdrawn) {
        return yield* new QuestionRevisionWithdrawn()
      }

      const stored = yield* oralStudyRepository.recordSelfAssessment(
        sessionId,
        position,
        oralRevisionId,
        selfAssessment,
      )

      const answeredAt = yield* DateTime.now

      yield* recordOralEvidence({
        userId,
        qualificationPathId: pathId,
        goalVersion: session.goalVersion,
        questionId: question.questionId,
        oralRevisionId,
        sessionId,
        position,
        selfAssessment,
        mode: session.kind,
        answeredAt,
      })

      if (session.kind === regularStudySession) {
        const round = yield* syncOralLearningRound(userId, pathId)
        const before = yield* oralStudyReader.learningRound(userId, pathId)
        yield* prepareOralDailyPlan(userId, pathId, oralExamAt(goal), before, answeredAt)
        yield* oralStudyRepository.recordCoverage(
          userId,
          pathId,
          question.questionId,
          oralRevisionId,
          round,
        )
        const after = yield* oralStudyReader.learningRound(userId, pathId)
        yield* recordOralDailyPlanAnswer(userId, pathId, answeredAt, { before, after })

        if (closesPlannedRound({ before, after })) {
          yield* grantStreakBridges(
            userId,
            completedRoundBridgeOf(pathId, oralExamAccess, after.round, answeredAt),
          )
        }

        yield* syncOralLearningRound(userId, pathId)
      }

      yield* recordStreakAnswers(userId, answeredAt, DailyAnswerCount.make(1))

      const next = yield* oralStudyReader.nextOpenPosition(sessionId, position)

      const moved = yield* oralStudyRepository.moveSession(
        sessionId,
        Option.getOrElse(next, () => position),
      )

      return { question: { ...question, selfAssessment: Option.some(stored) }, session: moved }
    }),
  )
})
