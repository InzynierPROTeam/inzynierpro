import { Data } from 'effect'

export class PathPermissionDenied extends Data.TaggedError('PathPermissionDenied') {}

export class StalePathConfiguration extends Data.TaggedError('StalePathConfiguration') {}

export class StaleExamGoal extends Data.TaggedError('StaleExamGoal') {}

export class UserPathLimitReached extends Data.TaggedError('UserPathLimitReached') {}
