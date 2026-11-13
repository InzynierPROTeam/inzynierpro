import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type {
  NewQuestion,
  ReferenceDocument,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import type { LearningContentWriteError } from './errors.js'

export class LearningContentRepository extends Context.Service<
  LearningContentRepository,
  {
    readonly createDocument: (
      document: ReferenceDocument,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly attachDocument: (
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createQuestion: (
      question: NewQuestion,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly withdrawRevision: (
      id: QuestionRevisionId,
    ) => Effect.Effect<void, LearningContentWriteError>
  }
>()('api/modules/learning-content/LearningContentRepository') {}
