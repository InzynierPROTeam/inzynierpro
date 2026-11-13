import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'

import { requirePathAccess } from './path-access.policy.js'

export const getGoalOptions = Effect.fn('Preparation.getGoalOptions')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId)

  const examCalendarReader = yield* ExamCalendarReader

  return yield* examCalendarReader.sessionsForPath(pathId, page)
})
