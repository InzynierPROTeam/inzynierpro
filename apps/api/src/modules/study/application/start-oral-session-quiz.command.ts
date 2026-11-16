import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  type KnowledgeCheckFormat,
  trueFalseFormat,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { Effect, Option, Random } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  OralQuizFormatNotSupported,
  OralQuizNotOffered,
  StudySessionMissing,
} from '~api/modules/study/domain/errors.js'
import {
  drawKnowledgeChecks,
  oralQuizCheckLimit,
} from '~api/modules/study/domain/oral-session-quiz.rules.js'

import { OralSessionQuizReader } from './oral-session-quiz.reader.js'
import { OralSessionQuizRepository } from './oral-session-quiz.repository.js'
import { OralStudyReader } from './oral-study.reader.js'
import { StudyRepository } from './study.repository.js'

export const startOralSessionQuiz = Effect.fn('Study.startOralSessionQuiz')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  formats: ReadonlyArray<KnowledgeCheckFormat>,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralSessionQuizReader = yield* OralSessionQuizReader
  const oralSessionQuizRepository = yield* OralSessionQuizRepository
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, oralExamAccess)
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
