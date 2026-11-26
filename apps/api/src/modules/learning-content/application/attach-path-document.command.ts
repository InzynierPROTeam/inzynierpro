import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'

import { LearningContentRepository } from './learning-content.repository.js'

export const attachPathDocument = Effect.fn('LearningContent.attachPathDocument')(function* (
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
) {
  const learningContentRepository = yield* LearningContentRepository
  const qualificationPathsRepository = yield* QualificationPathsRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* qualificationPathsRepository.lockExclusively(pathId)
      const position = yield* learningContentRepository.nextDocumentPosition(pathId)
      yield* learningContentRepository.attachDocument(pathId, documentId, position)
    }),
  )
})
