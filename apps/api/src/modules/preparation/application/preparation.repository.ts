import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import type { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'

import type { PreparationWriteError } from './errors.js'

export class PreparationRepository extends Context.Service<
  PreparationRepository,
  {
    readonly transaction: <A, E, R>(
      operation: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | PreparationWriteError, R>
    readonly lockUser: (userId: UserId) => Effect.Effect<void, PreparationWriteError>
    readonly insert: (
      userId: UserId,
      pathId: QualificationPathId,
      scope: ExamAccessScope,
    ) => Effect.Effect<void, PreparationWriteError>
    readonly appendGoal: (
      userId: UserId,
      pathId: QualificationPathId,
      version: UserExamGoalVersion,
      sessionId: ExamSessionId,
      scope: ExamAccessScope,
      oralDate: Option.Option<DateTimeUtc>,
    ) => Effect.Effect<void, PreparationWriteError>
    readonly archive: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<void, PreparationWriteError>
    readonly restore: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<void, PreparationWriteError>
    readonly setDistrictChamber: (
      userId: UserId,
      pathId: QualificationPathId,
      districtChamberId: Option.Option<DistrictChamberId>,
    ) => Effect.Effect<void, PreparationWriteError>
    readonly extend: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<void, PreparationWriteError>
  }
>()('api/modules/preparation/PreparationRepository') {}
