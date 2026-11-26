import { Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import type { NewOralQuestion } from '~api/modules/learning-content/domain/learning-content.model.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'

import { assignToLockedPath } from './assign-oral-question.command.js'
import { LearningContentRepository } from './learning-content.repository.js'

export const createOralQuestion = Effect.fn('LearningContent.createOralQuestion')(function* (
  question: NewOralQuestion,
) {
  const learningContentRepository = yield* LearningContentRepository
  const qualificationPathsRepository = yield* QualificationPathsRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* qualificationPathsRepository.lockExclusively(question.qualificationPathId)
      yield* learningContentRepository.createOralQuestion(question)
      yield* assignToLockedPath(question.qualificationPathId, question)
    }),
  )
})
