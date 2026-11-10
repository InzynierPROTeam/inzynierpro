import { Schema } from 'effect'
import {
  errorFields,
  ForbiddenAnnotations,
  ConflictAnnotations,
  BadRequestAnnotations,
} from '~api-contracts/utils/api-error.js'

export class PathAccessDenied extends Schema.TaggedError<
  PathAccessDenied,
  { readonly brand: unique symbol }
>()('PathAccessDenied', errorFields('path_access_denied'), ForbiddenAnnotations()) {}

export class InvalidPathConfiguration extends Schema.TaggedError<
  InvalidPathConfiguration,
  { readonly brand: unique symbol }
>()(
  'InvalidPathConfiguration',
  errorFields('invalid_path_configuration'),
  BadRequestAnnotations(),
) {}

export class GoalConflict extends Schema.TaggedError<
  GoalConflict,
  { readonly brand: unique symbol }
>()('GoalConflict', errorFields('goal_conflict'), ConflictAnnotations()) {}
