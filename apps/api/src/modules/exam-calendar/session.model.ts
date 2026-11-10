import { ApiDateTime } from '@inzpro/domain/common/date-time'
import { ExamSessionOption } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Schema } from 'effect'

export const CalendarSession = Schema.Struct({
  ...ExamSessionOption.fields,
  generalChamberId: GeneralChamberId,
  writtenAt: ApiDateTime,
  oralPlanningAt: ApiDateTime,
  selectionClosesAt: ApiDateTime,
})

export type CalendarSession = typeof CalendarSession.Type
