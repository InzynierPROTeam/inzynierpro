import { CursorPagination } from '@inzpro/domain/common/pagination'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const GetDocumentsParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const GetSessionPreviewParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  documentId: ReferenceDocumentId,
})

export const DocumentsQuery = CursorPagination
export const OralMaterialsQuery = CursorPagination
