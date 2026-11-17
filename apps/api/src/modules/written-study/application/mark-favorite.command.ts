import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { QuestionNotOnPath } from '~api/modules/learning/domain/errors.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const markFavorite = Effect.fn('Study.markFavorite')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository

  if (!(yield* studyReader.isPathQuestion(pathId, questionId))) {
    return yield* new QuestionNotOnPath()
  }

  yield* studyRepository.markFavorite(userId, questionId)

  return { questionId, isFavorite: true }
})
