import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const unmarkFavorite = Effect.fn('Study.unmarkFavorite')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const studyRepository = yield* StudyRepository

  yield* studyRepository.unmarkFavorite(userId, questionId)

  return { questionId, isFavorite: false }
})
