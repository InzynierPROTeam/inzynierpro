import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { reviewStudySession } from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { StaleSessionScope } from '~api/modules/learning/domain/errors.js'
import { isAllowedQuestionCount } from '~api/modules/learning/domain/session-count.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import {
  StudyDocumentNotFound,
  UnfinishedSessionExists,
} from '~api/modules/written-study/domain/errors.js'
import { reviewSessionSettings } from '~api/modules/written-study/domain/review-session.rules.js'
import { shuffleAnswerOrders } from '~api/modules/written-study/domain/study-session.rules.js'

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
