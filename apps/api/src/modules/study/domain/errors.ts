import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Data } from 'effect'

export class StudyDocumentNotFound extends Data.TaggedError('StudyDocumentNotFound') {}

export class QuestionNotOnPath extends Data.TaggedError('QuestionNotOnPath') {}

/** The requested session no longer fits the material or settings the preview offered. */
export class StaleSessionScope extends Data.TaggedError('StaleSessionScope') {}

export class UnfinishedSessionExists extends Data.TaggedError('UnfinishedSessionExists')<{
  readonly sessionId: StudySessionId
  readonly currentPosition: SessionQuestionPosition
}> {}

export class StudySessionMissing extends Data.TaggedError('StudySessionMissing') {}

export class SessionQuestionMissing extends Data.TaggedError('SessionQuestionMissing') {}

export class SessionAlreadyEnded extends Data.TaggedError('SessionAlreadyEnded') {}

export class QuestionRevisionWithdrawn extends Data.TaggedError('QuestionRevisionWithdrawn') {}

export class AnswerNotInQuestion extends Data.TaggedError('AnswerNotInQuestion') {}

export class QuestionAlreadyAnswered extends Data.TaggedError('QuestionAlreadyAnswered') {}
