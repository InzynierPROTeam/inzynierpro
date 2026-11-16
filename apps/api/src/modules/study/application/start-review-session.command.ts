import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { reviewStudySession } from '@inzpro/domain/modules/study/study-session'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  StaleSessionScope,
  StudyDocumentNotFound,
  UnfinishedSessionExists,
} from '~api/modules/study/domain/errors.js'
import { reviewSessionSettings } from '~api/modules/study/domain/review-session.rules.js'
import { isAllowedQuestionCount } from '~api/modules/study/domain/session-preview.rules.js'
import { shuffleAnswerOrders } from '~api/modules/study/domain/study-session.rules.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Starts a ReviewSession of the questions due now on the whole path or one document (ADR-0002),
 * after confirming its preview. It holds the most overdue questions first, pins their current
 * revisions and shuffles their options as regular study does, and is never padded with questions
 * that are not due. An unfinished review session of the same scope refuses the start and is
 * reported so the client can continue it. The account lock serializes it with other starts and
 * answers, so the due questions are counted against committed state.
 */
export const startReviewSession = Effect.fn('Study.startReviewSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
  questionCount: QuestionCount,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, writtenExamAccess)

      if (Option.isSome(documentId)) {
        const document = yield* studyReader.pathDocument(pathId, documentId.value)

        if (Option.isNone(document)) {
          return yield* new StudyDocumentNotFound()
        }
      }

      const unfinished = yield* studyReader.unfinishedSession(
        userId,
        pathId,
        reviewStudySession,
        documentId,
      )

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const now = yield* DateTime.now
      const queue = yield* studyReader.reviewQueue(userId, pathId, documentId, now)
      const settings = reviewSessionSettings(queue.dueCount)

      if (Option.isNone(settings) || !isAllowedQuestionCount(settings.value, questionCount)) {
        return yield* new StaleSessionScope()
      }

      const candidates = yield* studyReader.reviewCandidates(
        userId,
        pathId,
        documentId,
        now,
        questionCount,
      )

      // Each statement sees newly committed rows, so a withdrawal between the two reads could shrink the set.
      if (candidates.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      const questions = yield* shuffleAnswerOrders(candidates)

      return yield* studyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        kind: reviewStudySession,
        documentId,
        goalVersion: assignment.goal.version,
        questions,
      })
    }),
  )
})
