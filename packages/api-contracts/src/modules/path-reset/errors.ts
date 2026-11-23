import { Schema } from 'effect'
import { errorFields, ConflictAnnotations } from '~api-contracts/utils/api-error.js'

export class PathResetConflict extends Schema.TaggedError<
  PathResetConflict,
  { readonly brand: unique symbol }
>()('PathResetConflict', errorFields('path_reset_conflict'), ConflictAnnotations()) {}
