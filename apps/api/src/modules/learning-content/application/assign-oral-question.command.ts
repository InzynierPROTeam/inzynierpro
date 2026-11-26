import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import type { OralQuestionAssignment } from '~api/modules/learning-content/domain/learning-content.model.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'

import { LearningContentRepository } from './learning-content.repository.js'

export const assignToLockedPath = Effect.fn('LearningContent.assignToLockedPath')(function* (
  pathId: QualificationPathId,
  question: OralQuestionAssignment,
) {
  const learningContentRepository = yield* LearningContentRepository

  if (!(yield* learningContentRepository.hasOralCategory(pathId, question.categoryId))) {
    const position = yield* learningContentRepository.nextOralCategoryPosition(pathId)
    yield* learningContentRepository.attachOralCategory(pathId, question.categoryId, position)
  }

  yield* learningContentRepository.assignOralQuestion(pathId, question)
})

export const assignOralQuestion = Effect.fn('LearningContent.assignOralQuestion')(function* (
  pathId: QualificationPathId,
  question: OralQuestionAssignment,
) {
  const qualificationPathsRepository = yield* QualificationPathsRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* qualificationPathsRepository.lockExclusively(pathId)
      yield* assignToLockedPath(pathId, question)
    }),
  )
})
