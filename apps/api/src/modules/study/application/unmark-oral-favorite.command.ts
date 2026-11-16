import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { OralStudyRepository } from './oral-study.repository.js'

export const unmarkOralFavorite = Effect.fn('Study.unmarkOralFavorite')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: OralQuestionId,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyRepository = yield* OralStudyRepository

  yield* oralStudyRepository.unmarkFavorite(userId, questionId)

  return { questionId, isFavorite: false }
})
