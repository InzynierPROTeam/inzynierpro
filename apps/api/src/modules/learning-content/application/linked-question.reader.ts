import type { DocumentEditionId } from '@inzpro/domain/modules/learning-content/document-edition'
import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  LinkedOralQuestion,
  LinkedWrittenQuestion,
  UnitQuestionCount,
} from '~api/modules/learning-content/domain/linked-question.model.js'

import type { LearningContentReadError } from './errors.js'

export type PathDocument = {
  readonly pathId: QualificationPathId
  readonly documentId: ReferenceDocumentId
}

export class LinkedQuestionReader extends Context.Service<
  LinkedQuestionReader,
  {
    readonly unitQuestionCounts: (
      document: PathDocument,
      accessScope: ExamAccessScope,
      editionId: DocumentEditionId,
    ) => Effect.Effect<ReadonlyArray<UnitQuestionCount>, LearningContentReadError>
    readonly linkedWrittenQuestions: (
      document: PathDocument,
      address: DocumentSectionAddress,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<LinkedWrittenQuestion>, LearningContentReadError | InvalidCursor>
    readonly linkedOralQuestions: (
      document: PathDocument,
      address: DocumentSectionAddress,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<LinkedOralQuestion>, LearningContentReadError | InvalidCursor>
  }
>()('api/modules/learning-content/LinkedQuestionReader') {}
