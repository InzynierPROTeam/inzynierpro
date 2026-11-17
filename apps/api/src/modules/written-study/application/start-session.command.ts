import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  regularStudySession,
  type SessionQuestionSelection,
} from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { StaleSessionScope } from '~api/modules/learning/domain/errors.js'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import { isAllowedQuestionCount } from '~api/modules/learning/domain/session-count.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import {
  StudyDocumentNotFound,
  UnfinishedSessionExists,
} from '~api/modules/written-study/domain/errors.js'
import {
  sessionQuestionPool,
  writtenStudySettings,
} from '~api/modules/written-study/domain/session-preview.rules.js'
import { shuffleAnswerOrders } from '~api/modules/written-study/domain/study-session.rules.js'

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
