import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const GetDocumentsParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const GetDocumentParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  documentId: ReferenceDocumentId,
})

export const DocumentsQuery = CursorPagination
export const OralMaterialsQuery = CursorPagination

export const SessionPreviewQuery = Schema.Struct({
  documentId: Schema.optional(ReferenceDocumentId),
  afterDocumentId: Schema.optional(ReferenceDocumentId),
})
