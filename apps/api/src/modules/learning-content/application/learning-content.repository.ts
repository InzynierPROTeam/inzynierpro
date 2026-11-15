import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type {
  NewQuestion,
  NewQuestionRevision,
  QuestionRevisionWithdrawal,
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
    /** Makes the revision current for new sessions; started sessions keep their pinned revisions. */
    readonly publishRevision: (
      revision: NewQuestionRevision,
    ) => Effect.Effect<void, LearningContentWriteError>
    /**
     * Withdraws a published revision, which then accepts no answers even in started sessions. A
     * revision is withdrawn once: repeating it keeps the first decision and its reason.
     */
    readonly withdrawRevision: (
      withdrawal: QuestionRevisionWithdrawal,
    ) => Effect.Effect<void, LearningContentWriteError>
  }
>()('api/modules/learning-content/LearningContentRepository') {}
