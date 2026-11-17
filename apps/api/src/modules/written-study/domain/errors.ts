import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import { Data } from 'effect'

export class StudyDocumentNotFound extends Data.TaggedError('StudyDocumentNotFound') {}

export class UnfinishedSessionExists extends Data.TaggedError('UnfinishedSessionExists')<{
  readonly sessionId: StudySessionId
  readonly currentPosition: SessionQuestionPosition
}> {}

export class AnswerNotInQuestion extends Data.TaggedError('AnswerNotInQuestion') {}

export class QuestionAlreadyAnswered extends Data.TaggedError('QuestionAlreadyAnswered') {}
