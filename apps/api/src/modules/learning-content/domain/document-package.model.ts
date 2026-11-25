import { ByteSize } from '@inzpro/domain/modules/learning-content/content-asset'
import {
  ContentAvailability,
  DocumentPageCount,
  EditionTextKind,
} from '@inzpro/domain/modules/learning-content/document-edition'
import type { PackageAvailability } from '@inzpro/domain/modules/learning-content/document-package'
import {
  ReferenceDocumentCode,
  ReferenceDocumentId,
  ReferenceDocumentKind,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

export const PackagePdf = Schema.Struct({
  pageCount: DocumentPageCount,
  size: ByteSize,
})

export type PackagePdf = typeof PackagePdf.Type

export const PackageDocument = Schema.Struct({
  id: ReferenceDocumentId,
  code: ReferenceDocumentCode,
  kind: ReferenceDocumentKind,
  abbreviation: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  editionLabel: Schema.NonEmptyString,
  textKind: EditionTextKind,
  contentAvailability: ContentAvailability,
  downloadable: Schema.Boolean,
  pdf: Schema.Option(PackagePdf),
})

export type PackageDocument = typeof PackageDocument.Type

export type DocumentPackageCandidate = Omit<
  PackageDocument,
  'contentAvailability' | 'downloadable'
> & {
  readonly availability: PackageAvailability
}
