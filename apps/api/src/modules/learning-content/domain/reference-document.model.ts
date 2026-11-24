import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ExternalUrl } from '@inzpro/domain/common/external-url'
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
import { Schema } from 'effect'

export const ReferenceDocumentSummary = Schema.Struct({
  id: ReferenceDocumentId,
  code: ReferenceDocumentCode,
  kind: ReferenceDocumentKind,
  abbreviation: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  editionLabel: Schema.NonEmptyString,
})

export type ReferenceDocumentSummary = typeof ReferenceDocumentSummary.Type

export const PublishedEdition = Schema.Struct({
  id: DocumentEditionId,
  label: Schema.NonEmptyString,
  textKind: EditionTextKind,
  effectiveFrom: DateTimeUtc,
  externalUrl: ExternalUrl,
  availability: ContentAvailability,
  downloadable: Schema.Boolean,
})

export type PublishedEdition = typeof PublishedEdition.Type

export const PublishedReferenceDocument = Schema.Struct({
  id: ReferenceDocumentId,
  code: ReferenceDocumentCode,
  kind: ReferenceDocumentKind,
  abbreviation: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  description: Schema.OptionFromNullOr(Schema.NonEmptyString),
  edition: PublishedEdition,
})

export type PublishedReferenceDocument = typeof PublishedReferenceDocument.Type
