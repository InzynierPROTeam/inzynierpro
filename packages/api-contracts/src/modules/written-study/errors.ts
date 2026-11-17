import {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
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
