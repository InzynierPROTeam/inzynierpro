import type { CursorPage, CursorPagination, InvalidCursor } from '@inzpro/domain/common/pagination'
import type {
  ExamSessionId,
  ExamSessionOption,
} from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Context, type Effect } from 'effect'

import type { ExamCalendarReadError } from './errors.js'

export class ExamCalendarReader extends Context.Service<
  ExamCalendarReader,
  {
    readonly sessions: (
      specializationId: SpecializationId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<ExamSessionOption>, ExamCalendarReadError | InvalidCursor>
    readonly sessionsForPath: (
      pathId: QualificationPathId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<ExamSessionOption>, ExamCalendarReadError | InvalidCursor>
    readonly isEligible: (
      pathId: QualificationPathId,
      sessionId: ExamSessionId,
    ) => Effect.Effect<boolean, ExamCalendarReadError>
  }
>()('api/modules/exam-calendar/ExamCalendarReader') {}
