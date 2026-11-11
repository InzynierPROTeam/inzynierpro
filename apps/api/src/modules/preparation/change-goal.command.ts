import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { GoalChange } from '@inzpro/domain/modules/preparation/onboarding'
import { nextUserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Equal } from 'effect'
import { ExamCalendarReader } from '~api/modules/exam-calendar/exam-calendar.reader.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/exam-calendar.repository.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/qualification-paths.repository.js'

import { StaleExamGoal, StalePathConfiguration } from './errors.js'
import { requirePathAccess } from './path-access.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const changeGoal = Effect.fn('Preparation.changeGoal')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  change: GoalChange,
) {
  const preparationRepository = yield* PreparationRepository
  const examCalendarReader = yield* ExamCalendarReader
  const examCalendarRepository = yield* ExamCalendarRepository
  const qualificationPathsRepository = yield* QualificationPathsRepository

  return yield* preparationRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const path = yield* requirePathAccess(userId, pathId)

      const unchanged =
        change.examSessionId === path.goal.examSessionId &&
        Equal.equals(change.oralExamDate, path.goal.oralExamDate)

      if (unchanged) {
        return { qualificationPathId: pathId, existing: true, archived: false }
      }

      if (change.expectedVersion !== path.goal.version) {
        return yield* new StaleExamGoal()
      }

      yield* qualificationPathsRepository.lock(pathId)
      yield* examCalendarRepository.lock(change.examSessionId)

      if (
        change.examSessionId !== path.goal.examSessionId &&
        !(yield* examCalendarReader.isEligible(pathId, change.examSessionId))
      ) {
        return yield* new StalePathConfiguration()
      }

      yield* preparationRepository.appendGoal(
        userId,
        pathId,
        nextUserExamGoalVersion(path.goal.version),
        change.examSessionId,
        path.accessScope,
        change.oralExamDate,
      )

      return { qualificationPathId: pathId, existing: true, archived: false }
    }),
  )
})
