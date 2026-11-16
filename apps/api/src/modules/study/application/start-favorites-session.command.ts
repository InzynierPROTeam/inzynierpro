import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { favoritesStudySession } from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  StaleSessionScope,
  StudyDocumentNotFound,
  UnfinishedSessionExists,
} from '~api/modules/study/domain/errors.js'
import { favoritesSessionSettings } from '~api/modules/study/domain/favorites-session.rules.js'
import { isAllowedQuestionCount } from '~api/modules/study/domain/session-preview.rules.js'
import { shuffleAnswerOrders } from '~api/modules/study/domain/study-session.rules.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Starts a favourites session over the learner's FavoriteQuestions on the path or in one document
 * (ADR-0002), after confirming its preview. It holds them in catalogue order, pins their current revisions and
 * shuffles their options as regular study does. The set is fixed here, so later marks and unmarks
 * never change it. An unfinished favourites session of the same scope refuses the start and is reported
 * so the client can continue it; with nothing marked no session is created. The account lock
 * serializes it with other starts and answers.
 */
export const startFavoritesSession = Effect.fn('Study.startFavoritesSession')(function* (
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
        favoritesStudySession,
        documentId,
      )

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const settings = favoritesSessionSettings(
        yield* studyReader.favoriteQuestionCount(userId, pathId, documentId),
      )

      if (Option.isNone(settings) || !isAllowedQuestionCount(settings.value, questionCount)) {
        return yield* new StaleSessionScope()
      }

      const candidates = yield* studyReader.favoriteCandidates(
        userId,
        pathId,
        documentId,
        questionCount,
      )

      // Marks are not taken under the account lock, so the set may change between the two reads.
      if (candidates.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      const questions = yield* shuffleAnswerOrders(candidates)

      return yield* studyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        kind: favoritesStudySession,
        documentId,
        goalVersion: assignment.goal.version,
        questions,
      })
    }),
  )
})
