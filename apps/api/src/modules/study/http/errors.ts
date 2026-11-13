import { DocumentNotFound } from '@inzpro/api-contracts/modules/study/errors'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failStudyRead = logAndFailInternalServerError('Could not read study material.')

export const failDocumentNotFound = () =>
  Effect.fail(
    new DocumentNotFound({
      type: 'document_not_found',
      message: 'The selected material was not found.',
    }),
  )
