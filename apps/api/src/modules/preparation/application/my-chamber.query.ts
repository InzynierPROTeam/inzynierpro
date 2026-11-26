import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { ChamberContactsReader } from '~api/modules/exam-calendar/application/chamber-contacts.reader.js'

import { requirePathAccess } from './path-access.policy.js'

export const getMyChamber = Effect.fn('Preparation.getMyChamber')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const assignment = yield* requirePathAccess(userId, pathId)
  const chamberContactsReader = yield* ChamberContactsReader
  const generalChamber = yield* chamberContactsReader.generalForPath(pathId)

  const districtChamber = yield* Option.match(assignment.districtChamber, {
    onNone: () => Effect.succeedNone,
    onSome: chamber => chamberContactsReader.district(chamber.id).pipe(Effect.asSome),
  })

  return { generalChamber, districtChamber }
})
