import type { UserId } from '@inzpro/domain/modules/identity/user'
import { initialUserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import {
  StalePathConfiguration,
  UserPathLimitReached,
} from '~api/modules/preparation/domain/errors.js'
import type { PathConfiguration } from '~api/modules/preparation/domain/preparation.model.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'

import { PreparationReader } from './preparation.reader.js'
import { PreparationRepository } from './preparation.repository.js'

export const completeOnboarding = Effect.fn('Preparation.completeOnboarding')(function* (
  userId: UserId,
  config: PathConfiguration,
) {
  const preparationRepository = yield* PreparationRepository
  const transaction = yield* Transaction
  const preparationReader = yield* PreparationReader
  const qualificationPathsReader = yield* QualificationPathsReader
  const examCalendarReader = yield* ExamCalendarReader
  const qualificationPathsRepository = yield* QualificationPathsRepository
  const examCalendarRepository = yield* ExamCalendarRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const resolved = yield* qualificationPathsReader.resolve(config)

      if (Option.isNone(resolved)) {
        return yield* new StalePathConfiguration()
      }

      const path = resolved.value
      const existing = yield* preparationReader.path(userId, path.id)

      if (Option.isSome(existing)) {
        return { qualificationPathId: path.id, existing: true, archived: existing.value.archived }
      }

      if (yield* preparationReader.hasReachedPathLimit(userId)) {
        return yield* new UserPathLimitReached()
      }

      yield* qualificationPathsRepository.lock(path.id)
      yield* examCalendarRepository.lock(config.examSessionId)
      const current = yield* qualificationPathsReader.resolve(config)

      if (
        Option.isNone(current) ||
        current.value.id !== path.id ||
        !(yield* examCalendarReader.isEligible(path.id, config.examSessionId))
      ) {
        return yield* new StalePathConfiguration()
      }

      yield* preparationRepository.insert(userId, path.id, config.accessScope)
      yield* preparationRepository.appendGoal(
        userId,
        path.id,
        initialUserExamGoalVersion,
        config.examSessionId,
        config.accessScope,
        config.oralExamDate,
      )

      return { qualificationPathId: path.id, existing: false, archived: false }
    }),
  )
})
