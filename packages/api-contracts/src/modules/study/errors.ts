import { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { SessionQuestionPosition, StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'
import {
  ConflictAnnotations,
  errorFields,
  NotFoundAnnotations,
  UnprocessableEntityAnnotations,
} from '~api-contracts/utils/api-error.js'

export class DocumentNotFound extends Schema.TaggedError<
  DocumentNotFound,
  { readonly brand: unique symbol }
>()('DocumentNotFound', errorFields('document_not_found'), NotFoundAnnotations()) {}

export class QuestionNotFound extends Schema.TaggedError<
  QuestionNotFound,
  { readonly brand: unique symbol }
>()('QuestionNotFound', errorFields('question_not_found'), NotFoundAnnotations()) {}

export class StaleSessionPreview extends Schema.TaggedError<
  StaleSessionPreview,
  { readonly brand: unique symbol }
>()('StaleSessionPreview', errorFields('stale_session_preview'), ConflictAnnotations()) {}

export class StudySessionAlreadyStarted extends Schema.TaggedError<
  StudySessionAlreadyStarted,
  { readonly brand: unique symbol }
>()(
  'StudySessionAlreadyStarted',
  {
    ...errorFields('study_session_already_started'),
    sessionId: StudySessionId,
    currentPosition: SessionQuestionPosition,
  },
  ConflictAnnotations(),
) {}

export class StudySessionNotFound extends Schema.TaggedError<
  StudySessionNotFound,
  { readonly brand: unique symbol }
>()('StudySessionNotFound', errorFields('study_session_not_found'), NotFoundAnnotations()) {}

export class SessionQuestionNotFound extends Schema.TaggedError<
  SessionQuestionNotFound,
  { readonly brand: unique symbol }
>()('SessionQuestionNotFound', errorFields('session_question_not_found'), NotFoundAnnotations()) {}

export class StudySessionEnded extends Schema.TaggedError<
  StudySessionEnded,
  { readonly brand: unique symbol }
>()('StudySessionEnded', errorFields('study_session_ended'), ConflictAnnotations()) {}

export class SessionQuestionWithdrawn extends Schema.TaggedError<
  SessionQuestionWithdrawn,
  { readonly brand: unique symbol }
>()('SessionQuestionWithdrawn', errorFields('session_question_withdrawn'), ConflictAnnotations()) {}

// CONTRACT: InvalidSessionAnswer means answerId does not belong to the revision pinned by the session.
export class InvalidSessionAnswer extends Schema.TaggedError<
  InvalidSessionAnswer,
  { readonly brand: unique symbol }
>()(
  'InvalidSessionAnswer',
  errorFields('invalid_session_answer'),
  UnprocessableEntityAnnotations(),
) {}

export class SessionAnswerAlreadySubmitted extends Schema.TaggedError<
  SessionAnswerAlreadySubmitted,
  { readonly brand: unique symbol }
>()(
  'SessionAnswerAlreadySubmitted',
  errorFields('session_answer_already_submitted'),
  ConflictAnnotations(),
) {}

export class OralCategoryNotFound extends Schema.TaggedError<
  OralCategoryNotFound,
  { readonly brand: unique symbol }
>()('OralCategoryNotFound', errorFields('oral_category_not_found'), NotFoundAnnotations()) {}

export class OralSessionAlreadyStarted extends Schema.TaggedError<
  OralSessionAlreadyStarted,
  { readonly brand: unique symbol }
>()(
  'OralSessionAlreadyStarted',
  {
    ...errorFields('oral_session_already_started'),
    sessionId: OralStudySessionId,
    currentPosition: SessionQuestionPosition,
  },
  ConflictAnnotations(),
) {}

// CONTRACT: InvalidOralSelfAssessment means oralRevisionId differs from the revision pinned by the session.
export class InvalidOralSelfAssessment extends Schema.TaggedError<
  InvalidOralSelfAssessment,
  { readonly brand: unique symbol }
>()(
  'InvalidOralSelfAssessment',
  errorFields('invalid_oral_self_assessment'),
  UnprocessableEntityAnnotations(),
) {}

export class OralSelfAssessmentAlreadySubmitted extends Schema.TaggedError<
  OralSelfAssessmentAlreadySubmitted,
  { readonly brand: unique symbol }
>()(
  'OralSelfAssessmentAlreadySubmitted',
  errorFields('oral_self_assessment_already_submitted'),
  ConflictAnnotations(),
) {}

// CONTRACT: OralQuizUnavailable means the session is unfinished or has no knowledge checks in the requested formats.
export class OralQuizUnavailable extends Schema.TaggedError<
  OralQuizUnavailable,
  { readonly brand: unique symbol }
>()('OralQuizUnavailable', errorFields('oral_quiz_unavailable'), ConflictAnnotations()) {}

// CONTRACT: OralQuizFormatUnsupported means the started quiz contains a format the client did not list; the quiz keeps its checks.
export class OralQuizFormatUnsupported extends Schema.TaggedError<
  OralQuizFormatUnsupported,
  { readonly brand: unique symbol }
>()(
  'OralQuizFormatUnsupported',
  errorFields('oral_quiz_format_unsupported'),
  UnprocessableEntityAnnotations(),
) {}

export class OralQuizCheckNotFound extends Schema.TaggedError<
  OralQuizCheckNotFound,
  { readonly brand: unique symbol }
>()('OralQuizCheckNotFound', errorFields('oral_quiz_check_not_found'), NotFoundAnnotations()) {}

// CONTRACT: InvalidOralQuizSelection means an option is not offered by the check, repeats, or the count does not fit its format.
export class InvalidOralQuizSelection extends Schema.TaggedError<
  InvalidOralQuizSelection,
  { readonly brand: unique symbol }
>()(
  'InvalidOralQuizSelection',
  errorFields('invalid_oral_quiz_selection'),
  UnprocessableEntityAnnotations(),
) {}

export class OralQuizCheckAlreadyAnswered extends Schema.TaggedError<
  OralQuizCheckAlreadyAnswered,
  { readonly brand: unique symbol }
>()(
  'OralQuizCheckAlreadyAnswered',
  errorFields('oral_quiz_check_already_answered'),
  ConflictAnnotations(),
) {}
