import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
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
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
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
      yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })

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
      const isRegularStudy = session.kind === regularStudySession

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
        yield* studyRepository.recordCoverage(
          userId,
          pathId,
          question.questionId,
          questionRevisionId,
          round,
        )
        yield* syncLearningRound(userId, pathId)
      }

      const next = yield* studyReader.nextOpenPosition(sessionId, position)

      const moved = yield* studyRepository.moveSession(
        sessionId,
        Option.getOrElse(next, () => position),
      )

      return { question: { ...question, answer: Option.some(stored) }, session: moved }
    }),
  )
})
