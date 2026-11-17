import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { SessionQuestionMissing } from '~api/modules/learning/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import type { SessionQuestion } from '~api/modules/written-study/domain/study-session.model.js'

const withSessionQuestion = <E, R>(
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
  record: (question: SessionQuestion) => Effect.Effect<SessionQuestion, E, R>,
) =>
  Effect.gen(function* () {
    const studyReader = yield* StudyReader
    const transaction = yield* Transaction
    const preparationRepository = yield* PreparationRepository

    return yield* transaction.run(
      Effect.gen(function* () {
        yield* preparationRepository.lockUser(userId)
        yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })

        const session = yield* studyReader.session(userId, pathId, sessionId)
        const question = yield* studyReader.sessionQuestion(userId, pathId, sessionId, position)

        if (Option.isNone(session) || Option.isNone(question)) {
          return yield* new SessionQuestionMissing()
        }

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
