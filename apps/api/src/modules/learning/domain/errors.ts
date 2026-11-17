import { Data } from 'effect'

export class QuestionNotOnPath extends Data.TaggedError('QuestionNotOnPath') {}

export class StaleSessionScope extends Data.TaggedError('StaleSessionScope') {}

export class SessionQuestionMissing extends Data.TaggedError('SessionQuestionMissing') {}

export class SessionAlreadyEnded extends Data.TaggedError('SessionAlreadyEnded') {}

export class QuestionRevisionWithdrawn extends Data.TaggedError('QuestionRevisionWithdrawn') {}

export class StudySessionMissing extends Data.TaggedError('StudySessionMissing') {}
