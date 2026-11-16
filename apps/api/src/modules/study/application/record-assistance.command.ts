import type { UserId } from '@inzpro/domain/modules/identity/user'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { SessionQuestionMissing } from '~api/modules/study/domain/errors.js'
import type { SessionQuestion } from '~api/modules/study/domain/study-session.model.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Runs one assistance record for a session question under the account lock, which orders it
 * against a concurrent submission, so an answer is assisted exactly when the record committed
 * first. `record` returns the updated question, or the question unchanged when nothing is kept.
 */
const withSessionQuestion = <E, R>(
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
  record: (question: SessionQuestion) => Effect.Effect<SessionQuestion, E, R>,
) =>
  Effect.gen(function* () {
    const studyReader = yield* StudyReader
    const studyRepository = yield* StudyRepository
    const preparationRepository = yield* PreparationRepository

    return yield* studyRepository.transaction(
      Effect.gen(function* () {
        yield* preparationRepository.lockUser(userId)
        yield* requirePathAccess(userId, pathId, writtenExamAccess)

        const session = yield* studyReader.session(userId, pathId, sessionId)
        const question = yield* studyReader.sessionQuestion(userId, pathId, sessionId, position)

        if (Option.isNone(session) || Option.isNone(question)) {
          return yield* new SessionQuestionMissing()
        }

        // A record only marks the answer that follows it, so it is kept only where one still can.
        if (
          Option.isSome(question.value.answer) ||
          Option.isSome(session.value.endedAt) ||
          question.value.isWithdrawn
        ) {
          return question.value
        }

        return yield* record(question.value)
      }),
    )
  })

/**
 * Records that the learner opened the explanation before answering, so the answer is assisted at
 * the explanation level (ADR-0002). Opening it again, after answering, in an ended session or on
 * a withdrawn question changes nothing, because no answer can follow it.
 */
export const recordExplanationOpening = Effect.fn('Study.recordExplanationOpening')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
) {
  const studyRepository = yield* StudyRepository

  return yield* withSessionQuestion(userId, pathId, sessionId, position, question =>
    Option.isSome(question.explanationOpenedAt)
      ? Effect.succeed(question)
      : studyRepository
          .recordExplanationOpening(sessionId, position)
          .pipe(
            Effect.map(openedAt => ({ ...question, explanationOpenedAt: Option.some(openedAt) })),
          ),
  )
})

/**
 * Records that the learner opened their saved PersonalQuestionNote before answering, so the answer
 * is assisted at the note level unless the explanation was opened too (ADR-0002). Opening an empty
 * note records nothing; neither does opening it again, after answering, in an ended session or on
 * a withdrawn question.
 */
export const recordNoteOpening = Effect.fn('Study.recordNoteOpening')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
) {
  const studyRepository = yield* StudyRepository

  return yield* withSessionQuestion(userId, pathId, sessionId, position, question =>
    Option.isNone(question.note) || Option.isSome(question.noteOpenedAt)
      ? Effect.succeed(question)
      : studyRepository
          .recordNoteOpening(sessionId, position)
          .pipe(Effect.map(openedAt => ({ ...question, noteOpenedAt: Option.some(openedAt) }))),
  )
})
