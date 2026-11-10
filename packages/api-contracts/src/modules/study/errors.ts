import { Schema } from 'effect'
import { errorFields, NotFoundAnnotations } from '~api-contracts/utils/api-error.js'

export class DocumentNotFound extends Schema.TaggedError<
  DocumentNotFound,
  { readonly brand: unique symbol }
>()('DocumentNotFound', errorFields('document_not_found'), NotFoundAnnotations()) {}
