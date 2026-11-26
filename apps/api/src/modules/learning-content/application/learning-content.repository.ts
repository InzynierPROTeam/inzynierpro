import type { DocumentEditionId } from '@inzpro/domain/modules/learning-content/document-edition'
import type {
  OralQuestionCategoryId,
  PathOralCategoryPosition,
} from '@inzpro/domain/modules/learning-content/oral-question-category'
import type {
  PathDocumentPosition,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { UnknownContentAsset } from '~api/modules/learning-content/domain/errors.js'
import type {
  ContentAsset,
  DocumentEdition,
  DocumentSectionContent,
  NewOralKnowledgeCheck,
  NewOralQuestion,
  NewOralRevision,
  NewQuestion,
  NewQuestionReference,
  NewQuestionRevision,
  OralDraftEdit,
  OralQuestionAssignment,
  OralQuestionCategory,
  OralRevisionWithdrawal,
  QuestionRevisionWithdrawal,
  ReferenceDocument,
  RegionalQuestionLink,
  SectionRelocation,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import type { LearningContentWriteError } from './errors.js'

export class LearningContentRepository extends Context.Service<
  LearningContentRepository,
  {
    readonly createDocument: (
      document: ReferenceDocument,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createEdition: (
      edition: DocumentEdition,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly saveSectionContent: (
      section: DocumentSectionContent,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly publishEdition: (
      editionId: DocumentEditionId,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly recordSectionRelocation: (
      relocation: SectionRelocation,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly makeCurrentEdition: (
      documentId: ReferenceDocumentId,
      editionId: DocumentEditionId,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly nextDocumentPosition: (
      pathId: QualificationPathId,
    ) => Effect.Effect<PathDocumentPosition, LearningContentWriteError>
    readonly attachDocument: (
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
      position: PathDocumentPosition,
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
    readonly addWrittenReference: (
      revisionId: QuestionRevisionId,
      reference: NewQuestionReference,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly withdrawRevision: (
      withdrawal: QuestionRevisionWithdrawal,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createOralCategory: (
      category: OralQuestionCategory,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly createOralQuestion: (
      question: NewOralQuestion,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly hasOralCategory: (
      pathId: QualificationPathId,
      categoryId: OralQuestionCategoryId,
    ) => Effect.Effect<boolean, LearningContentWriteError>
    readonly nextOralCategoryPosition: (
      pathId: QualificationPathId,
    ) => Effect.Effect<PathOralCategoryPosition, LearningContentWriteError>
    readonly attachOralCategory: (
      pathId: QualificationPathId,
      categoryId: OralQuestionCategoryId,
      position: PathOralCategoryPosition,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly assignOralQuestion: (
      pathId: QualificationPathId,
      question: OralQuestionAssignment,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly linkOralQuestionToChamber: (
      link: RegionalQuestionLink,
    ) => Effect.Effect<void, LearningContentWriteError>
    readonly editOralDraft: (
      edit: OralDraftEdit,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly publishOralRevision: (
      revision: NewOralRevision,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly createKnowledgeCheck: (
      check: NewOralKnowledgeCheck,
    ) => Effect.Effect<void, LearningContentWriteError | UnknownContentAsset>
    readonly withdrawOralRevision: (
      withdrawal: OralRevisionWithdrawal,
    ) => Effect.Effect<void, LearningContentWriteError>
  }
>()('api/modules/learning-content/LearningContentRepository') {}
