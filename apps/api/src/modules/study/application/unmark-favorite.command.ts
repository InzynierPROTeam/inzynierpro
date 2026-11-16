import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { StudyRepository } from './study.repository.js'

/**
 * Removes the learner's FavoriteQuestion mark from a question, and so from every path (ADR-0002).
 * The mark is the learner's own, so it can be removed even after the question left the path, for
 * example from an older session's results. Unmarking an unmarked question changes nothing, and a
 * started favourites session keeps the question.
 */
export const unmarkFavorite = Effect.fn('Study.unmarkFavorite')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyRepository = yield* StudyRepository

  yield* studyRepository.unmarkFavorite(userId, questionId)

  return { questionId, isFavorite: false }
})
