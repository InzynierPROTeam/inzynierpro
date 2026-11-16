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
    readonly publishRevision: (
      revision: NewQuestionRevision,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
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
    readonly editOralDraft: (
      edit: OralDraftEdit,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly publishOralRevision: (
      revision: NewOralRevision,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly withdrawOralRevision: (
      withdrawal: OralRevisionWithdrawal,
    ) => Effect.Effect<void, LearningContentWriteError>
  }
>()('api/modules/learning-content/LearningContentRepository') {}
