import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ExamSessionOption } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Schema } from 'effect'

export const CalendarSession = Schema.Struct({
  ...ExamSessionOption.fields,
  generalChamberId: GeneralChamberId,
  writtenAt: DateTimeUtc,
  oralPlanningAt: DateTimeUtc,
  selectionClosesAt: DateTimeUtc,
})

export type CalendarSession = typeof CalendarSession.Type
