import { Schema } from 'effect'
import { errorFields, NotFoundAnnotations } from '~api-contracts/utils/api-error.js'

export class ProfileNotFound extends Schema.TaggedError<
  ProfileNotFound,
  { readonly brand: unique symbol }
>()('ProfileNotFound', errorFields('profile_not_found'), NotFoundAnnotations()) {}
