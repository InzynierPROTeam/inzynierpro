import type { DocumentEditionId } from '@inzpro/domain/modules/learning-content/document-edition'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  DocumentSection,
  PublishedReferenceDocument,
  ReferenceDocumentSummary,
} from '~api/modules/learning-content/domain/reference-document.model.js'

import type { LearningContentReadError } from './errors.js'

export class ReferenceDocumentReader extends Context.Service<
  ReferenceDocumentReader,
  {
    readonly pathDocuments: (
      pathId: QualificationPathId,
      page: CursorPageRequest,
    ) => Effect.Effect<
      CursorPage<ReferenceDocumentSummary>,
      LearningContentReadError | InvalidCursor
    >
    readonly pathDocument: (
      pathId: QualificationPathId,
      code: ReferenceDocumentCode,
    ) => Effect.Effect<Option.Option<PublishedReferenceDocument>, LearningContentReadError>
    readonly editionSections: (
      editionId: DocumentEditionId,
    ) => Effect.Effect<ReadonlyArray<DocumentSection>, LearningContentReadError>
  }
>()('api/modules/learning-content/ReferenceDocumentReader') {}
