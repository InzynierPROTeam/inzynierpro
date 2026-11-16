import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Data } from 'effect'

export class StudyDocumentNotFound extends Data.TaggedError('StudyDocumentNotFound') {}

export class QuestionNotOnPath extends Data.TaggedError('QuestionNotOnPath') {}

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

export class OralRevisionNotInSession extends Data.TaggedError('OralRevisionNotInSession') {}

export class OralQuestionAlreadyAssessed extends Data.TaggedError('OralQuestionAlreadyAssessed') {}

export class OralCategoryNotOnPath extends Data.TaggedError('OralCategoryNotOnPath') {}

export class UnfinishedOralSessionExists extends Data.TaggedError('UnfinishedOralSessionExists')<{
  readonly sessionId: OralStudySessionId
  readonly currentPosition: SessionQuestionPosition
}> {}

export class OralQuizNotOffered extends Data.TaggedError('OralQuizNotOffered') {}

export class OralQuizFormatNotSupported extends Data.TaggedError('OralQuizFormatNotSupported') {}

export class OralQuizCheckMissing extends Data.TaggedError('OralQuizCheckMissing') {}

export class OralQuizSelectionNotAllowed extends Data.TaggedError('OralQuizSelectionNotAllowed') {}

export class OralQuizCheckAlreadyChecked extends Data.TaggedError('OralQuizCheckAlreadyChecked') {}
