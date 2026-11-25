import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const GetReferenceDocumentsParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
})

export const ReferenceDocumentsQuery = CursorPagination

export const GetReferenceDocumentParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  code: ReferenceDocumentCode,
})

export const LinkedQuestionsQuery = Schema.Struct({
  address: DocumentSectionAddress,
  ...CursorPagination.fields,
})
