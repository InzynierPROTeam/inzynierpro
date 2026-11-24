import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import {
  DocumentDownloadNotAllowed,
  ReferenceDocumentNotFound,
} from '~api-contracts/modules/learning-content/errors.js'
import {
  GetReferenceDocumentParams,
  GetReferenceDocumentsParams,
  ReferenceDocumentsQuery,
} from '~api-contracts/modules/learning-content/requests.js'
import {
  DocumentPdfResponse,
  DocumentSectionsResponse,
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

export const GetDocumentSectionsEndpoint = HttpApiEndpoint.get(
  'GetDocumentSections',
  '/paths/:qualificationPathId/documents/:code/sections',
  {
    params: GetReferenceDocumentParams,
    success: DocumentSectionsResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, ReferenceDocumentNotFound],
  },
)

export const GetDocumentPdfEndpoint = HttpApiEndpoint.get(
  'GetDocumentPdf',
  '/paths/:qualificationPathId/documents/:code/pdf',
  {
    params: GetReferenceDocumentParams,
    success: DocumentPdfResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, ReferenceDocumentNotFound],
  },
)

export const GetDocumentPdfDownloadEndpoint = HttpApiEndpoint.get(
  'GetDocumentPdfDownload',
  '/paths/:qualificationPathId/documents/:code/pdf/download',
  {
    params: GetReferenceDocumentParams,
    success: DocumentPdfResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      ReferenceDocumentNotFound,
      DocumentDownloadNotAllowed,
    ],
  },
)

export const SourcesApi = HttpApiGroup.make('Sources')
  .add(GetReferenceDocumentsEndpoint)
  .add(GetReferenceDocumentEndpoint)
  .add(GetDocumentSectionsEndpoint)
  .add(GetDocumentPdfEndpoint)
  .add(GetDocumentPdfDownloadEndpoint)
  .middleware(Authentication)
  .prefix('/sources')
