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

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Records that the learner opened the explanation before answering, so the answer is assisted
 * (ADR-0002). Opening it again, after answering, in an ended session or on a withdrawn question
 * changes nothing, because no answer can follow it. The account lock orders it
 * against a concurrent submission, so an answer is assisted exactly when this committed first.
 */
export const recordAssistance = Effect.fn('Study.recordAssistance')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
) {
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

      // The record only marks the answer that follows it, so it is kept only where one still can.
      if (
        Option.isSome(question.value.answer) ||
        Option.isSome(question.value.explanationOpenedAt) ||
        Option.isSome(session.value.endedAt) ||
        question.value.isWithdrawn
      ) {
        return question.value
      }

      yield* studyRepository.recordAssistance(sessionId, position)

      return yield* studyReader.sessionQuestion(userId, pathId, sessionId, position).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () => Effect.die(new Error('The assisted session question was not read back')),
            onSome: Effect.succeed,
          }),
        ),
      )
    }),
  )
})
