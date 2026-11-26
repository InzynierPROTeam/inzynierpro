import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Context, type Effect, type Option } from 'effect'
import type {
  ChamberOffice,
  ChamberWebsite,
} from '~api/modules/exam-calendar/domain/chamber-contact.model.js'

import type { ExamCalendarWriteError } from './errors.js'

export type ChamberContactPublication = {
  readonly generalChamberId: Option.Option<GeneralChamberId>
  readonly districtChamberId: Option.Option<DistrictChamberId>
  readonly sortOrder: number
  readonly published: boolean
}

export class ChamberContactsRepository extends Context.Service<
  ChamberContactsRepository,
  {
    readonly createOffice: (
      office: ChamberOffice & ChamberContactPublication,
    ) => Effect.Effect<void, ExamCalendarWriteError>
    readonly createWebsite: (
      website: ChamberWebsite & ChamberContactPublication,
    ) => Effect.Effect<void, ExamCalendarWriteError>
  }
>()('api/modules/exam-calendar/ChamberContactsRepository') {}
