import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  DistrictChamberCode,
  DistrictChamberId,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
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
