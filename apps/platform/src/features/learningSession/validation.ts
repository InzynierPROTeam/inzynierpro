import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

export const LearningPreviewSearch = Schema.Struct({
  'akt-prawny': Schema.optional(ReferenceDocumentId),
  'obecny-akt-prawny': Schema.optional(ReferenceDocumentId),
  'liczba-pytan': Schema.optional(Schema.Int.check(Schema.isGreaterThan(0))),
})
