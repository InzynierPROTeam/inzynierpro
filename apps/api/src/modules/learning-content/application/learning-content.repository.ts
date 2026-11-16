import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { UnknownContentAsset } from '~api/modules/learning-content/domain/errors.js'
import type {
  ContentAsset,
  NewOralQuestion,
  NewOralRevision,
  NewQuestion,
  NewQuestionRevision,
  OralDraftEdit,
  OralQuestionCategory,
  OralRevisionWithdrawal,
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
    readonly attachQuestion: (
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createAsset: (asset: ContentAsset) => Effect.Effect<void, LearningContentWriteError>
    readonly createQuestion: (
      question: NewQuestion,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    /**
     * Makes the revision current for new sessions with its change kind; started sessions keep their
     * pinned revisions.
     */
    readonly publishRevision: (
      revision: NewQuestionRevision,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    /**
     * Withdraws a published revision, which then accepts no answers even in started sessions. A
     * revision is withdrawn once: repeating it keeps the first decision and its reason.
     */
    readonly withdrawRevision: (
      withdrawal: QuestionRevisionWithdrawal,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createOralCategory: (
      category: OralQuestionCategory,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createOralQuestion: (
      question: NewOralQuestion,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly assignOralQuestion: (
      pathId: QualificationPathId,
      questionId: OralQuestionId,
    ) => Effect.Effect<void, LearningContentWriteError>
    /** A published revision is immutable, so the write fails (ADR-0003). */
    readonly editOralDraft: (
      edit: OralDraftEdit,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    /** Makes the oral revision current with its change kind; earlier revisions stay unchanged (ADR-0003). */
    readonly publishOralRevision: (
      revision: NewOralRevision,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    /** Withdraws a published oral revision once; repeating it keeps the first decision and reason. */
    readonly withdrawOralRevision: (
      withdrawal: OralRevisionWithdrawal,
    ) => Effect.Effect<void, LearningContentWriteError>
  }
>()('api/modules/learning-content/LearningContentRepository') {}
