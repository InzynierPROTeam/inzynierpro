import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  type KnowledgeCheckFormat,
  trueFalseFormat,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option, Random } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { StudySessionMissing } from '~api/modules/learning/domain/errors.js'
import { OralSessionQuizReader } from '~api/modules/oral-study/application/oral-session-quiz.reader.js'
import { OralSessionQuizRepository } from '~api/modules/oral-study/application/oral-session-quiz.repository.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import {
  OralQuizFormatNotSupported,
  OralQuizNotOffered,
} from '~api/modules/oral-study/domain/errors.js'
import {
  drawKnowledgeChecks,
  oralQuizCheckLimit,
} from '~api/modules/oral-study/domain/oral-session-quiz.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const startOralSessionQuiz = Effect.fn('Study.startOralSessionQuiz')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  formats: ReadonlyArray<KnowledgeCheckFormat>,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralSessionQuizReader = yield* OralSessionQuizReader
  const oralSessionQuizRepository = yield* OralSessionQuizRepository
  const preparationRepository = yield* PreparationRepository

  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
      const session = yield* oralStudyReader.session(userId, pathId, sessionId)

      if (Option.isNone(session)) {
        return yield* new StudySessionMissing()
      }

      const existing = yield* oralSessionQuizReader.quiz(userId, pathId, sessionId)

      if (Option.isSome(existing)) {
        if (existing.value.formats.some(format => !formats.includes(format))) {
          return yield* new OralQuizFormatNotSupported()
        }

        return existing.value
      }

      if (Option.isNone(session.value.endedAt)) {
        return yield* new OralQuizNotOffered()
      }

      const candidates = yield* oralSessionQuizReader.candidates(sessionId, formats)
      const drawn = yield* drawKnowledgeChecks(candidates, oralQuizCheckLimit)

      if (drawn.length === 0) {
        return yield* new OralQuizNotOffered()
      }

      const checks = yield* Effect.forEach(drawn, check =>
        check.format === trueFalseFormat
          ? Effect.succeed(check)
          : Effect.map(Random.shuffle(check.optionIds), optionIds => ({ ...check, optionIds })),
      )

      yield* oralSessionQuizRepository.createQuiz({ sessionId, checks })
      const created = yield* oralSessionQuizReader.quiz(userId, pathId, sessionId)

      if (Option.isNone(created)) {
        return yield* new OralQuizNotOffered()
      }

      return created.value
    }),
  )
})
