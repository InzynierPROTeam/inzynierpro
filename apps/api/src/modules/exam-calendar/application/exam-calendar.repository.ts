import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { Context, type Effect } from 'effect'
import type { CalendarSession } from '~api/modules/exam-calendar/domain/exam-session.model.js'

import type { ExamCalendarWriteError } from './errors.js'

export class ExamCalendarRepository extends Context.Service<
  ExamCalendarRepository,
  {
    readonly create: (session: CalendarSession) => Effect.Effect<void, ExamCalendarWriteError>
    readonly closeSelection: (
      id: ExamSessionId,
      at: DateTimeUtc,
    ) => Effect.Effect<void, ExamCalendarWriteError>
    readonly lock: (id: ExamSessionId) => Effect.Effect<void, ExamCalendarWriteError>
  }
>()('api/modules/exam-calendar/ExamCalendarRepository') {}
