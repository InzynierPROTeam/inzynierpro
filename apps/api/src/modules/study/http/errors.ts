import {
  DocumentNotFound,
  StaleSessionPreview,
  StudySessionAlreadyStarted,
} from '@inzpro/api-contracts/modules/study/errors'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import type { UnfinishedSessionExists } from '~api/modules/study/domain/errors.js'

export const failStudyRead = logAndFailInternalServerError('Could not read study material.')

export const documentNotFound = Effect.fail(
  new DocumentNotFound({
    type: 'document_not_found',
    message: 'The selected material was not found.',
  }),
)

export const failStudyWrite = logAndFailInternalServerError('Could not save study progress.')

export const staleSessionPreview = Effect.fail(
  new StaleSessionPreview({
    type: 'stale_session_preview',
    message: 'The available questions or settings changed. Review the preview before starting.',
  }),
)

export const studySessionAlreadyStarted = (error: UnfinishedSessionExists) =>
  Effect.fail(
    new StudySessionAlreadyStarted({
      type: 'study_session_already_started',
      message: 'This material already has an unfinished study session. Continue it instead.',
      sessionId: error.sessionId,
      currentPosition: error.currentPosition,
    }),
  )
