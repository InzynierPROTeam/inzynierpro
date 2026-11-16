import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  regularStudySession,
  type SessionQuestionSelection,
} from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  StaleSessionScope,
  StudyDocumentNotFound,
  UnfinishedSessionExists,
} from '~api/modules/study/domain/errors.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'
import {
  isAllowedQuestionCount,
  sessionQuestionPool,
  writtenStudySettings,
} from '~api/modules/study/domain/session-preview.rules.js'
import { shuffleAnswerOrders } from '~api/modules/study/domain/study-session.rules.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

export const startSession = Effect.fn('Study.startSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
  questionCount: QuestionCount,
  questionSelection: SessionQuestionSelection,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, writtenExamAccess)

      const unfinished = yield* studyReader.unfinishedSession(
        userId,
        pathId,
        regularStudySession,
        Option.some(documentId),
      )

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const round = currentLearningRound(yield* studyReader.learningRound(userId, pathId))
      const document = yield* studyReader.document(userId, pathId, round, documentId)

      if (Option.isNone(document)) {
        return yield* new StudyDocumentNotFound()
      }

      const pool = sessionQuestionPool(document.value)

      if (
        pool.selection !== questionSelection ||
        !isAllowedQuestionCount(writtenStudySettings(pool.questionCount), questionCount)
      ) {
        return yield* new StaleSessionScope()
      }

      const candidates = yield* studyReader.sessionCandidates(
        userId,
        pathId,
        round,
        documentId,
        questionSelection,
        questionCount,
      )

      if (candidates.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      const questions = yield* shuffleAnswerOrders(candidates)

      return yield* studyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        kind: regularStudySession,
        documentId: Option.some(documentId),
        goalVersion: assignment.goal.version,
        questions,
      })
    }),
  )
})
