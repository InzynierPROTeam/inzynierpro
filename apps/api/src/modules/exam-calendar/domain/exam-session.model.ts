import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Schema } from 'effect'

export const ExamSessionOption = Schema.Struct({
  id: ExamSessionId,
  name: Schema.NonEmptyString,
  writtenAt: DateTimeUtc,
  isConfirmed: Schema.Boolean,
})

export type ExamSessionOption = typeof ExamSessionOption.Type

export const CalendarSession = Schema.Struct({
  ...ExamSessionOption.fields,
  generalChamberId: GeneralChamberId,
  oralPlanningAt: DateTimeUtc,
  selectionClosesAt: DateTimeUtc,
})

export type CalendarSession = typeof CalendarSession.Type
