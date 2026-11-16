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

/** The question is not on the path, so it cannot be marked or unmarked from it. */
export class QuestionNotFound extends Schema.TaggedError<
  QuestionNotFound,
  { readonly brand: unique symbol }
>()('QuestionNotFound', errorFields('question_not_found'), NotFoundAnnotations()) {}

export class StaleSessionPreview extends Schema.TaggedError<
  StaleSessionPreview,
  { readonly brand: unique symbol }
>()('StaleSessionPreview', errorFields('stale_session_preview'), ConflictAnnotations()) {}

/** The document already has an unfinished session; the client offers to continue it instead. */
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

/** The question's revision was withdrawn after the session started and accepts no answers. */
export class SessionQuestionWithdrawn extends Schema.TaggedError<
  SessionQuestionWithdrawn,
  { readonly brand: unique symbol }
>()('SessionQuestionWithdrawn', errorFields('session_question_withdrawn'), ConflictAnnotations()) {}

/** The answer is not an option of the revision this session shows for the question. */
export class InvalidSessionAnswer extends Schema.TaggedError<
  InvalidSessionAnswer,
  { readonly brand: unique symbol }
>()(
  'InvalidSessionAnswer',
  errorFields('invalid_session_answer'),
  UnprocessableEntityAnnotations(),
) {}

/** Another answer to this question was submitted first; the client rereads the stored result. */
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

/** The oral category already has an unfinished session; the client offers to continue it instead. */
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

/** The self-assessment refers to another revision than the one this session pinned for the question. */
export class InvalidOralSelfAssessment extends Schema.TaggedError<
  InvalidOralSelfAssessment,
  { readonly brand: unique symbol }
>()(
  'InvalidOralSelfAssessment',
  errorFields('invalid_oral_self_assessment'),
  UnprocessableEntityAnnotations(),
) {}

/** The question already has another self-assessment in this session; the client rereads the stored one. */
export class OralSelfAssessmentAlreadySubmitted extends Schema.TaggedError<
  OralSelfAssessmentAlreadySubmitted,
  { readonly brand: unique symbol }
>()(
  'OralSelfAssessmentAlreadySubmitted',
  errorFields('oral_self_assessment_already_submitted'),
  ConflictAnnotations(),
) {}
