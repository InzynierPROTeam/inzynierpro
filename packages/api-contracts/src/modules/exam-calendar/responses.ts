import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  ChamberOfficeId,
  ChamberWebsiteId,
  ChamberWebsiteKind,
} from '@inzpro/domain/modules/exam-calendar/chamber-contact'
import {
  DistrictChamberCode,
  DistrictChamberId,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Schema } from 'effect'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const ExamSessionOption = Schema.Struct({
  id: ExamSessionId,
  name: Schema.NonEmptyString,
  writtenAt: UtcIsoDateTime,
  isConfirmed: Schema.Boolean,
})

export type ExamSessionOption = typeof ExamSessionOption.Type

export const ExamSessionsResponse = CursorPaginatedResponse(ExamSessionOption)

export const DistrictChamber = Schema.Struct({
  id: DistrictChamberId,
  code: DistrictChamberCode,
  name: Schema.NonEmptyString,
  shortName: Schema.NonEmptyString,
})

export type DistrictChamber = typeof DistrictChamber.Type

export const DistrictChambersResponse = CursorPaginatedResponse(DistrictChamber)

export const ChamberOfficeContact = Schema.Struct({
  value: Schema.NonEmptyString,
  label: Schema.NullOr(Schema.NonEmptyString),
})

export const ChamberOffice = Schema.Struct({
  id: ChamberOfficeId,
  name: Schema.NonEmptyString,
  address: Schema.NonEmptyString,
  isPrimary: Schema.Boolean,
  openingHours: Schema.NullOr(Schema.NonEmptyString),
  sourceUrl: Schema.NonEmptyString,
  checkedAt: UtcIsoDateTime,
  phones: Schema.Array(ChamberOfficeContact),
  emails: Schema.Array(ChamberOfficeContact),
})

export type ChamberOffice = typeof ChamberOffice.Type

export const ChamberWebsite = Schema.Struct({
  id: ChamberWebsiteId,
  url: Schema.NonEmptyString,
  label: Schema.NullOr(Schema.NonEmptyString),
  kind: ChamberWebsiteKind,
  sourceUrl: Schema.NonEmptyString,
  checkedAt: UtcIsoDateTime,
})

export type ChamberWebsite = typeof ChamberWebsite.Type

export const ChamberContacts = Schema.Struct({
  id: Schema.Union([GeneralChamberId, DistrictChamberId]),
  name: Schema.NonEmptyString,
  shortName: Schema.NonEmptyString,
  offices: Schema.Array(ChamberOffice),
  websites: Schema.Array(ChamberWebsite),
})

export type ChamberContacts = typeof ChamberContacts.Type

export const GeneralChamberContacts = Schema.Struct({
  ...ChamberContacts.fields,
  id: GeneralChamberId,
})

export type GeneralChamberContacts = typeof GeneralChamberContacts.Type

export const DistrictChamberContacts = Schema.Struct({
  ...ChamberContacts.fields,
  id: DistrictChamberId,
})

export type DistrictChamberContacts = typeof DistrictChamberContacts.Type
