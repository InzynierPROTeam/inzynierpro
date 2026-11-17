import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  continueStudyNextStep,
  regularStudySession,
  reviewNextStep,
  reviewStudySession,
  startStudyNextStep,
  type StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { getSessionPreview } from '~api/modules/written-study/application/session-preview.query.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import type { SessionNextStep } from '~api/modules/written-study/domain/session-next-step.model.js'
import { suggestedReview } from '~api/modules/written-study/domain/session-next-step.rules.js'

export const getSessionNextStep = Effect.fn('Study.getSessionNextStep')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const found = yield* studyReader.session(userId, pathId, sessionId)

  if (Option.isNone(found)) {
    return Option.none<SessionNextStep>()
  }

  const session = found.value
  const now = yield* DateTime.now
  const pathQueue = yield* studyReader.reviewQueue(userId, pathId, Option.none(), now)

  const scopeQueue =
    session.kind === reviewStudySession && Option.isSome(session.documentId)
      ? yield* studyReader.reviewQueue(userId, pathId, session.documentId, now)
      : pathQueue

  const review = suggestedReview(session, { scope: scopeQueue.dueCount, path: pathQueue.dueCount })

  if (Option.isSome(review)) {
    const inDocument = Option.isSome(review.value.documentId)

    return Option.some<SessionNextStep>({
      type: reviewNextStep,
      document: inDocument
        ? Option.all({ id: session.documentId, title: session.documentTitle })
        : Option.none(),
      dueCount: inDocument ? scopeQueue.dueCount : pathQueue.dueCount,
    })
  }

  const unfinished = yield* studyReader.latestUnfinishedSession(userId, pathId)

  if (Option.isSome(unfinished)) {
    return Option.some<SessionNextStep>({ type: continueStudyNextStep, session: unfinished.value })
  }

  const fromDocumentId =
    session.kind === regularStudySession
      ? session.documentId
      : Option.flatMap(
          yield* studyReader.latestSession(userId, pathId, Option.none()),
          latest => latest.documentId,
        )

  const preview = yield* getSessionPreview(userId, pathId, Option.none(), fromDocumentId)

  return Option.map(preview, (next): SessionNextStep => ({
    type: startStudyNextStep,
    preview: next,
  }))
})
