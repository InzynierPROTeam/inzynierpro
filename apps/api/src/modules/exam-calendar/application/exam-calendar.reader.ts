import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Context, type Effect } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type { DistrictChamber } from '~api/modules/exam-calendar/domain/district-chamber.model.js'
import type { ExamSessionOption } from '~api/modules/exam-calendar/domain/exam-session.model.js'

import type { ExamCalendarReadError } from './errors.js'

export class ExamCalendarReader extends Context.Service<
  ExamCalendarReader,
  {
    readonly sessions: (
      specializationId: SpecializationId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<ExamSessionOption>, ExamCalendarReadError | InvalidCursor>
    readonly sessionsForPath: (
      pathId: QualificationPathId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<ExamSessionOption>, ExamCalendarReadError | InvalidCursor>
    readonly isEligible: (
      pathId: QualificationPathId,
      sessionId: ExamSessionId,
    ) => Effect.Effect<boolean, ExamCalendarReadError>
    readonly districtChambers: (
      generalChamberId: GeneralChamberId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<DistrictChamber>, ExamCalendarReadError | InvalidCursor>
    readonly isDistrictChamberEligible: (
      pathId: QualificationPathId,
      districtChamberId: DistrictChamberId,
    ) => Effect.Effect<boolean, ExamCalendarReadError>
  }
>()('api/modules/exam-calendar/ExamCalendarReader') {}
