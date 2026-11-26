import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type {
  GeneralChamberContacts,
  DistrictChamberContacts,
} from '~api/modules/exam-calendar/domain/chamber-contact.model.js'

import type { ExamCalendarReadError } from './errors.js'

export class ChamberContactsReader extends Context.Service<
  ChamberContactsReader,
  {
    readonly generalForPath: (
      pathId: QualificationPathId,
    ) => Effect.Effect<GeneralChamberContacts, ExamCalendarReadError>
    readonly district: (
      id: DistrictChamberId,
    ) => Effect.Effect<DistrictChamberContacts, ExamCalendarReadError>
  }
>()('api/modules/exam-calendar/ChamberContactsReader') {}
