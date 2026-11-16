import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'

import { OralStudyReader } from './oral-study.reader.js'

export const getOralMaterials = Effect.fn('Study.getOralMaterials')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  page: CursorPageRequest,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const round = currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId))

  return yield* oralStudyReader.categories(userId, pathId, round, page)
})
