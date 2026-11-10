import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { PathConfiguration } from '@inzpro/domain/modules/preparation/onboarding'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { Effect, Option, Schema } from 'effect'
import { ExamCalendarReader } from '~api/modules/exam-calendar/exam-calendar.reader.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/exam-calendar.repository.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/qualification-paths.reader.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/qualification-paths.repository.js'

import { StalePathConfiguration } from './errors.js'
import { PreparationReader } from './preparation.reader.js'
import { PreparationRepository } from './preparation.repository.js'

export const completeOnboarding = (userId: UserId, config: PathConfiguration) =>
  Effect.gen(function* () {
    const preparationRepository = yield* PreparationRepository
    const preparationReader = yield* PreparationReader
    const qualificationPathsReader = yield* QualificationPathsReader
    const examCalendarReader = yield* ExamCalendarReader
    const qualificationPathsRepository = yield* QualificationPathsRepository
    const examCalendarRepository = yield* ExamCalendarRepository

    return yield* preparationRepository.transaction(
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
        const version = Schema.decodeSync(UserExamGoalVersion)(1)
        yield* preparationRepository.appendGoal(
          userId,
          path.id,
          version,
          config.examSessionId,
          config.accessScope,
          config.oralExamDate,
        )
        yield* preparationRepository.select(userId, path.id)

        return { qualificationPathId: path.id, existing: false, archived: false }
      }),
    )
  })
