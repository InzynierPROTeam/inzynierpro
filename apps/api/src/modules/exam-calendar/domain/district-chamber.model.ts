import {
  DistrictChamberCode,
  DistrictChamberId,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { Schema } from 'effect'

export const DistrictChamber = Schema.Struct({
  id: DistrictChamberId,
  code: DistrictChamberCode,
  name: Schema.NonEmptyString,
  shortName: Schema.NonEmptyString,
})

export type DistrictChamber = typeof DistrictChamber.Type
