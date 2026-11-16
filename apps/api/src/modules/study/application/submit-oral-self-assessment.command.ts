import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/study/oral-study-session'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { regularStudySession } from '@inzpro/domain/modules/study/study-session'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  OralQuestionAlreadyAssessed,
  OralRevisionNotInSession,
  QuestionRevisionWithdrawn,
  SessionAlreadyEnded,
  SessionQuestionMissing,
} from '~api/modules/study/domain/errors.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'

import { recordOralEvidence } from './oral-review-state.service.js'
import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { StudyRepository } from './study.repository.js'

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
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, oralExamAccess)

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
        answeredAt: yield* DateTime.now,
      })

      if (session.kind === regularStudySession) {
        const round = yield* syncOralLearningRound(userId, pathId)
        yield* oralStudyRepository.recordCoverage(
          userId,
          pathId,
          question.questionId,
          oralRevisionId,
          round,
        )
        yield* syncOralLearningRound(userId, pathId)
      }

      const next = yield* oralStudyReader.nextOpenPosition(sessionId, position)

      const moved = yield* oralStudyRepository.moveSession(
        sessionId,
        Option.getOrElse(next, () => position),
      )

      return { question: { ...question, selfAssessment: Option.some(stored) }, session: moved }
    }),
  )
})
