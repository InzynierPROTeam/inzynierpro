import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Data } from 'effect'

export class StudyDocumentNotFound extends Data.TaggedError('StudyDocumentNotFound') {}

/** The requested session no longer fits the material or settings the preview offered. */
export class StaleSessionScope extends Data.TaggedError('StaleSessionScope') {}

/** A document has at most one unfinished session; restarting it is a separate action. */
export class UnfinishedSessionExists extends Data.TaggedError('UnfinishedSessionExists')<{
  readonly sessionId: StudySessionId
  readonly currentPosition: SessionQuestionPosition
}> {}

/** The session or its question does not exist for this user and path. */
export class SessionQuestionMissing extends Data.TaggedError('SessionQuestionMissing') {}

export class SessionAlreadyEnded extends Data.TaggedError('SessionAlreadyEnded') {}

export class QuestionRevisionWithdrawn extends Data.TaggedError('QuestionRevisionWithdrawn') {}

/** The answer is not an option of the revision the session pinned for the question. */
export class AnswerNotInQuestion extends Data.TaggedError('AnswerNotInQuestion') {}

/** The question already has a different answer in this session; the first one stays. */
export class QuestionAlreadyAnswered extends Data.TaggedError('QuestionAlreadyAnswered') {}
