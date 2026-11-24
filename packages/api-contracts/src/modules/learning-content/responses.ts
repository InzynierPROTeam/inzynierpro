import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { ExternalUrl } from '@inzpro/domain/common/external-url'
import { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import {
  ContentAvailability,
  DocumentEditionId,
  EditionTextKind,
} from '@inzpro/domain/modules/learning-content/document-edition'
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
