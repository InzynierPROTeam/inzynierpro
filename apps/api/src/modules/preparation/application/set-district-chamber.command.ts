import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Equal, Option } from 'effect'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { DistrictChamberUnavailable } from '~api/modules/preparation/domain/errors.js'

import { requirePathAccess } from './path-access.policy.js'
import { PreparationRepository } from './preparation.repository.js'

export const setDistrictChamber = Effect.fn('Preparation.setDistrictChamber')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  districtChamberId: Option.Option<DistrictChamberId>,
) {
  const preparationRepository = yield* PreparationRepository
  const examCalendarReader = yield* ExamCalendarReader
  const examCalendarRepository = yield* ExamCalendarRepository

  return yield* preparationRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const path = yield* requirePathAccess(userId, pathId)
      const result = { qualificationPathId: pathId, existing: true, archived: false }

      if (
        Equal.equals(
          districtChamberId,
          Option.map(path.districtChamber, chamber => chamber.id),
        )
      ) {
        return result
      }

      if (Option.isSome(districtChamberId)) {
        yield* examCalendarRepository.lockDistrictChamber(districtChamberId.value)

        if (
          !(yield* examCalendarReader.isDistrictChamberEligible(pathId, districtChamberId.value))
        ) {
          return yield* new DistrictChamberUnavailable()
        }
      }

      yield* preparationRepository.setDistrictChamber(userId, pathId, districtChamberId)

      return result
    }),
  )
})
