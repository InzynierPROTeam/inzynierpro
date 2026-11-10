import type { CursorPagination, CursorPage, InvalidCursor } from '@inzpro/domain/common/pagination'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  DocumentQuestionPool,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'

import type { StudyReadError } from './errors.js'

export class StudyReader extends Context.Service<
  StudyReader,
  {
    readonly documents: (
      userId: UserId,
      pathId: QualificationPathId,
      page: CursorPagination,
    ) => Effect.Effect<CursorPage<DocumentQuestionPool>, StudyReadError | InvalidCursor>
    readonly document: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<Option.Option<DocumentQuestionPool>, StudyReadError>
  }
>()('api/modules/study/StudyReader') {}
