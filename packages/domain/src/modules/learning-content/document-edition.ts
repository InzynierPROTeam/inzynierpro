import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const DocumentEditionId = Uuid.pipe(Schema.brand('DocumentEditionId'))

export type DocumentEditionId = typeof DocumentEditionId.Type

export const officialConsolidatedText = 'official_consolidated'
export const editorialConsolidationText = 'editorial_consolidation'
export const originalText = 'original'

export const editionTextKindValues = [
  officialConsolidatedText,
  editorialConsolidationText,
  originalText,
] as const

export const EditionTextKind = Schema.Literals(editionTextKindValues)

export type EditionTextKind = typeof EditionTextKind.Type

export const fullContentAvailability = 'full_content'
export const pdfOnlyAvailability = 'pdf_only'
export const metadataOnlyAvailability = 'metadata_only'

export const contentAvailabilityValues = [
  fullContentAvailability,
  pdfOnlyAvailability,
  metadataOnlyAvailability,
] as const

export const ContentAvailability = Schema.Literals(contentAvailabilityValues)

export type ContentAvailability = typeof ContentAvailability.Type
