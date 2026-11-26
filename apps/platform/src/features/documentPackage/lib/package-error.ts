import { Data } from 'effect'

export class PackageError extends Data.TaggedError('PackageError')<{
  readonly cause: unknown
}> {}
