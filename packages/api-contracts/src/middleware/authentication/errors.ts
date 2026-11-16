import { Schema } from 'effect'
import { errorFields, UnauthorizedAnnotations } from '~api-contracts/utils/api-error.js'

export class Unauthenticated extends Schema.TaggedError<
  Unauthenticated,
  { readonly brand: unique symbol }
>()('Unauthenticated', errorFields('unauthenticated'), UnauthorizedAnnotations()) {}
