import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { ReferenceDocumentNotFound } from '~api-contracts/modules/learning-content/errors.js'
import {
  GetReferenceDocumentParams,
  GetReferenceDocumentsParams,
  ReferenceDocumentsQuery,
} from '~api-contracts/modules/learning-content/requests.js'
import {
  ReferenceDocumentResponse,
  ReferenceDocumentsResponse,
} from '~api-contracts/modules/learning-content/responses.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

export const GetReferenceDocumentsEndpoint = HttpApiEndpoint.get(
  'GetReferenceDocuments',
  '/paths/:qualificationPathId/documents',
  {
    params: GetReferenceDocumentsParams,
    query: ReferenceDocumentsQuery,
    success: ReferenceDocumentsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, PathAccessDenied],
  },
)

export const GetReferenceDocumentEndpoint = HttpApiEndpoint.get(
  'GetReferenceDocument',
  '/paths/:qualificationPathId/documents/:code',
  {
    params: GetReferenceDocumentParams,
    success: ReferenceDocumentResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, ReferenceDocumentNotFound],
  },
)

export const SourcesApi = HttpApiGroup.make('Sources')
  .add(GetReferenceDocumentsEndpoint)
  .add(GetReferenceDocumentEndpoint)
  .middleware(Authentication)
  .prefix('/sources')
