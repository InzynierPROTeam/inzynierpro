import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { ExternalUrl } from '@inzpro/domain/common/external-url'
import { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import {
  ContentAvailability,
  DocumentEditionId,
  DocumentPageNumber,
  EditionTextKind,
} from '@inzpro/domain/modules/learning-content/document-edition'
import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { QuestionReferenceKind } from '@inzpro/domain/modules/learning-content/question-reference'
import {
  ReferenceDocumentCode,
  ReferenceDocumentId,
  ReferenceDocumentKind,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { AnyRichContent } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const ContentAssetAddress = Schema.Struct({
  id: ContentAssetId,
  url: Schema.NullOr(Schema.String),
})

export type ContentAssetAddress = typeof ContentAssetAddress.Type

export const ResolvedRichContent = Schema.Struct({
  content: AnyRichContent,
  assets: Schema.Array(ContentAssetAddress),
})

export type ResolvedRichContent = typeof ResolvedRichContent.Type

export const ReferenceDocumentSummary = Schema.Struct({
  id: ReferenceDocumentId,
  code: ReferenceDocumentCode,
  kind: ReferenceDocumentKind,
  abbreviation: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  editionLabel: Schema.NonEmptyString,
})

export type ReferenceDocumentSummary = typeof ReferenceDocumentSummary.Type

export const ReferenceDocumentsResponse = CursorPaginatedResponse(ReferenceDocumentSummary)

export const DocumentEdition = Schema.Struct({
  id: DocumentEditionId,
  label: Schema.NonEmptyString,
  textKind: EditionTextKind,
  effectiveFrom: UtcIsoDateTime,
  externalUrl: ExternalUrl,
  availability: ContentAvailability,
  downloadable: Schema.Boolean,
})

export type DocumentEdition = typeof DocumentEdition.Type

export const ReferenceDocument = Schema.Struct({
  id: ReferenceDocumentId,
  code: ReferenceDocumentCode,
  kind: ReferenceDocumentKind,
  abbreviation: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.NonEmptyString),
  edition: DocumentEdition,
})

export type ReferenceDocument = typeof ReferenceDocument.Type

export const ReferenceDocumentResponse = Schema.Struct({ document: ReferenceDocument })

export const DocumentSection = Schema.Struct({
  address: DocumentSectionAddress,
  parentAddress: Schema.NullOr(DocumentSectionAddress),
  title: Schema.NullOr(Schema.NonEmptyString),
  content: Schema.NullOr(ResolvedRichContent),
})

export type DocumentSection = typeof DocumentSection.Type

export const DocumentSectionsResponse = Schema.Struct({ sections: Schema.Array(DocumentSection) })

export const DocumentPdfResponse = Schema.Struct({ url: Schema.String })

export type DocumentPdfResponse = typeof DocumentPdfResponse.Type

export const QuestionReference = Schema.Struct({
  document: Schema.Struct({
    code: ReferenceDocumentCode,
    abbreviation: Schema.NonEmptyString,
    title: Schema.NonEmptyString,
  }),
  // CONTRACT: Null address and page refer to the whole document.
  address: Schema.NullOr(DocumentSectionAddress),
  page: Schema.NullOr(DocumentPageNumber),
  kind: QuestionReferenceKind,
  isCritical: Schema.Boolean,
  // CONTRACT: False when the document is not on the path, has no published current edition, an address is absent from that edition's full content, or a page cites an edition that is not PDF-only.
  isLinked: Schema.Boolean,
  // CONTRACT: The referenced unit with its nested units in document order for a linked direct-basis reference to a unit; null for every other reference.
  fragment: Schema.NullOr(Schema.Array(DocumentSection)),
})

export type QuestionReference = typeof QuestionReference.Type
