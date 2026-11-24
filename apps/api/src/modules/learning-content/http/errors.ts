import { ReferenceDocumentNotFound } from '@inzpro/api-contracts/modules/learning-content/errors'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const referenceDocumentNotFound = Effect.fail(
  new ReferenceDocumentNotFound({
    type: 'reference_document_not_found',
    message: 'The selected reference document was not found.',
  }),
)

export const failLearningContentRead = logAndFailInternalServerError(
  'Could not read reference documents.',
)
