import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  ChamberOfficeId,
  ChamberWebsiteId,
  ChamberWebsiteKind,
} from '@inzpro/domain/modules/exam-calendar/chamber-contact'
import { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Schema } from 'effect'

export const ChamberOfficeContact = Schema.Struct({
  value: Schema.NonEmptyString,
  label: Schema.OptionFromNullOr(Schema.NonEmptyString),
})

export const ChamberOffice = Schema.Struct({
  id: ChamberOfficeId,
  name: Schema.NonEmptyString,
  address: Schema.NonEmptyString,
  isPrimary: Schema.Boolean,
  openingHours: Schema.OptionFromNullOr(Schema.NonEmptyString),
  sourceUrl: Schema.NonEmptyString,
  checkedAt: DateTimeUtc,
  phones: Schema.Array(ChamberOfficeContact),
  emails: Schema.Array(ChamberOfficeContact),
})

export type ChamberOffice = typeof ChamberOffice.Type

export const ChamberWebsite = Schema.Struct({
  id: ChamberWebsiteId,
  url: Schema.NonEmptyString,
  label: Schema.OptionFromNullOr(Schema.NonEmptyString),
  kind: ChamberWebsiteKind,
  sourceUrl: Schema.NonEmptyString,
  checkedAt: DateTimeUtc,
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
