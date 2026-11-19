import { Data } from 'effect'

export class ProfileNotFound extends Data.TaggedError('ProfileNotFound') {}

export class InvalidProfileName extends Data.TaggedError('InvalidProfileName') {}
