import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { oralReviewSettings } from '~api/modules/study/domain/oral-review-session.rules.js'

import { OralStudyReader } from './oral-study.reader.js'

export const getOralFavoritesPreview = Effect.fn('Study.getOralFavoritesPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const favoriteQuestionCount = yield* oralStudyReader.favoriteQuestionCount(userId, pathId)

  return {
    qualificationPathId: pathId,
    favoriteQuestionCount,
    settings: oralReviewSettings(favoriteQuestionCount),
  }
})

export const getOralFavoritesSession = Effect.fn('Study.getOralFavoritesSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader

  return yield* oralStudyReader.unfinishedFavoritesSession(userId, pathId)
})
