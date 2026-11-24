import { DocumentPageNumber } from '@inzpro/domain/modules/learning-content/document-edition'
import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { QuestionReferenceKind } from '@inzpro/domain/modules/learning-content/question-reference'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

import { DocumentSection } from './reference-document.model.js'

export const QuestionReference = Schema.Struct({
  documentCode: ReferenceDocumentCode,
  documentAbbreviation: Schema.NonEmptyString,
  documentTitle: Schema.NonEmptyString,
  address: Schema.OptionFromNullOr(DocumentSectionAddress),
  page: Schema.OptionFromNullOr(DocumentPageNumber),
  kind: QuestionReferenceKind,
  isCritical: Schema.Boolean,
  isLinked: Schema.Boolean,
  fragment: Schema.Option(Schema.Array(DocumentSection)),
})

export type QuestionReference = typeof QuestionReference.Type
