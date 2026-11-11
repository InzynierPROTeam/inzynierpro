import type { CursorPagination } from '@inzpro/domain/common/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { ExamCalendarReader } from '~api/modules/exam-calendar/exam-calendar.reader.js'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'

export const getGoalOptions = Effect.fn('Preparation.getGoalOptions')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPagination,
) {
  yield* requirePathAccess(userId, pathId)

  const examCalendarReader = yield* ExamCalendarReader

  return yield* examCalendarReader.sessionsForPath(pathId, page)
})
