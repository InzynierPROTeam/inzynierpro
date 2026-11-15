import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  AnswerNotInQuestion,
  QuestionAlreadyAnswered,
  QuestionRevisionWithdrawn,
  SessionAlreadyEnded,
  SessionQuestionMissing,
} from '~api/modules/study/domain/errors.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'
import { noAssistance, studyMode } from '~api/modules/study/domain/review-state.model.js'
import { answerAssistance } from '~api/modules/study/domain/review-state.rules.js'

import { recordWrittenEvidence } from './review-state.service.js'
import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Stores the learner's current LearningRound when it moved past the stored one, which happens once
 * every question of the path is covered in it, and returns it.
 */
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

/**
 * Scores and stores the session's one answer to a question (ADR-0002). The answer, its LearningEvent,
 * the question's UserReviewState, the path's coverage in the current LearningRound, the next round
 * once this answer covers the last question of the path, and the session's continue point commit
 * together (ADR-0012). The session
 * continues from the next question still open; only the learner ends it. The account lock
 * serializes submissions with each other, with recording assistance and with assignment changes, so
 * the first answer wins: retrying it returns the stored result, and a different answer is refused.
 * Assistance comes from the recorded opening of the explanation, never from the client, and the
 * study day from backend time.
 */
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
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, writtenExamAccess)

      const found = Option.all({
        session: yield* studyReader.session(userId, pathId, sessionId),
        question: yield* studyReader.sessionQuestion(userId, pathId, sessionId, position),
      })

      if (Option.isNone(found)) {
        return yield* new SessionQuestionMissing()
      }

      const { session, question } = found.value

      if (Option.isSome(question.answer)) {
        // A retry after a lost response gets the stored result back instead of a second attempt.
        if (question.answer.value.answerId === answerId) {
          return { question, session }
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

      const stored = yield* studyRepository.recordAnswer(answer)
      yield* recordWrittenEvidence(answer, { mode: studyMode, assistance, answeredAt })
      // A withdrawal may have completed the stored round since the last answer, so it is synced first.
      const round = yield* syncLearningRound(userId, pathId)
      // Any submitted answer covers the question in the round, even a wrong or assisted one.
      yield* studyRepository.recordCoverage(
        userId,
        pathId,
        question.questionId,
        questionRevisionId,
        round,
      )
      // Covering the last uncovered question starts the next round (ADR-0002).
      yield* syncLearningRound(userId, pathId)

      // With nothing left open the session stays on this question until the learner ends it.
      const next = yield* studyReader.nextOpenPosition(sessionId, position)

      const moved = yield* studyRepository.moveSession(
        sessionId,
        Option.getOrElse(next, () => position),
      )

      return { question: { ...question, answer: Option.some(stored) }, session: moved }
    }),
  )
})
