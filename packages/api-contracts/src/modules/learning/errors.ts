import { Schema } from 'effect'
import {
  ConflictAnnotations,
  errorFields,
  NotFoundAnnotations,
} from '~api-contracts/utils/api-error.js'

export class QuestionNotFound extends Schema.TaggedError<
  QuestionNotFound,
  { readonly brand: unique symbol }
>()('QuestionNotFound', errorFields('question_not_found'), NotFoundAnnotations()) {}

export class StaleSessionPreview extends Schema.TaggedError<
  StaleSessionPreview,
  { readonly brand: unique symbol }
>()('StaleSessionPreview', errorFields('stale_session_preview'), ConflictAnnotations()) {}

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
