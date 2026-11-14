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
