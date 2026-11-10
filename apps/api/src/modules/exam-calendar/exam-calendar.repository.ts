import type { ApiDateTime } from '@inzpro/domain/common/date-time'
import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { Context, type Effect } from 'effect'
import type { ExamCalendarWriteError } from '~api/modules/exam-calendar/errors.js'

import type { CalendarSession } from './session.model.js'

export class ExamCalendarRepository extends Context.Service<
  ExamCalendarRepository,
  {
    readonly create: (session: CalendarSession) => Effect.Effect<void, ExamCalendarWriteError>
    readonly closeSelection: (
      id: ExamSessionId,
      at: ApiDateTime,
    ) => Effect.Effect<void, ExamCalendarWriteError>
    readonly lock: (id: ExamSessionId) => Effect.Effect<void, ExamCalendarWriteError>
  }
>()('api/modules/exam-calendar/ExamCalendarRepository') {}
