import { SessionQuestionPosition, StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'
import {
  ConflictAnnotations,
  errorFields,
  NotFoundAnnotations,
} from '~api-contracts/utils/api-error.js'

export class DocumentNotFound extends Schema.TaggedError<
  DocumentNotFound,
  { readonly brand: unique symbol }
>()('DocumentNotFound', errorFields('document_not_found'), NotFoundAnnotations()) {}

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
