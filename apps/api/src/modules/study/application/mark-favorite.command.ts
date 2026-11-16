import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { QuestionNotOnPath } from '~api/modules/study/domain/errors.js'

import { StudyReader } from './study.reader.js'
import { StudyRepository } from './study.repository.js'

/**
 * Marks a question of the path as the learner's FavoriteQuestion (ADR-0002). The mark belongs to
 * the question, so it shows on every path the question is on; marking it again changes nothing.
 * Started favourites sessions keep their questions.
 */
export const markFavorite = Effect.fn('Study.markFavorite')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository

  if (!(yield* studyReader.isPathQuestion(pathId, questionId))) {
    return yield* new QuestionNotOnPath()
  }

  yield* studyRepository.markFavorite(userId, questionId)

  return { questionId, isFavorite: true }
})
