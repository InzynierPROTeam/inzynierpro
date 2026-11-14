import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option, Random } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  StaleSessionScope,
  StudyDocumentNotFound,
  UnfinishedSessionExists,
} from '~api/modules/study/domain/errors.js'
import {
  isAllowedQuestionCount,
  writtenStudySettings,
} from '~api/modules/study/domain/session-preview.rules.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Starts the document's written study session after confirming its preview. An unfinished session
 * of the document refuses the start and is reported so the client can continue it; restarting is a
 * separate action. The account lock serializes concurrent starts with each other and with
 * assignment changes, so access and settings are checked against committed state.
 */
export const startSession = Effect.fn('Study.startSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
  questionCount: QuestionCount,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, writtenExamAccess)

      const unfinished = yield* studyReader.unfinishedSession(userId, pathId, documentId)

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const document = yield* studyReader.document(userId, pathId, documentId)

      if (Option.isNone(document)) {
        return yield* new StudyDocumentNotFound()
      }

      if (
        !isAllowedQuestionCount(
          writtenStudySettings(document.value.availableQuestionCount),
          questionCount,
        )
      ) {
        return yield* new StaleSessionScope()
      }

      const candidates = yield* studyReader.sessionCandidates(pathId, documentId, questionCount)

      // Each statement sees newly committed rows, so a withdrawal between the two reads could shrink the set.
      if (candidates.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      const questions = yield* Effect.forEach(candidates, candidate =>
        Effect.map(Random.shuffle(candidate.answerIds), answerIds => ({
          ...candidate,
          answerIds,
        })),
      )

      return yield* studyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        documentId,
        goalVersion: assignment.goal.version,
        questions,
      })
    }),
  )
})
