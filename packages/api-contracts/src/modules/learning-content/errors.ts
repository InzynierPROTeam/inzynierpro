import { Schema } from 'effect'
import { errorFields, NotFoundAnnotations } from '~api-contracts/utils/api-error.js'

export class ReferenceDocumentNotFound extends Schema.TaggedError<
  ReferenceDocumentNotFound,
  { readonly brand: unique symbol }
>()(
  'ReferenceDocumentNotFound',
  errorFields('reference_document_not_found'),
  NotFoundAnnotations(),
) {}
