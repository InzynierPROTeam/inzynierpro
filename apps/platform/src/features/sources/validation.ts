import { DocumentPageNumber } from '@inzpro/domain/modules/learning-content/document-edition'
import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { Schema } from 'effect'

export const ReferenceDocumentSearch = Schema.Struct({
  jednostka: Schema.optional(DocumentSectionAddress),
  strona: Schema.optional(DocumentPageNumber),
})
