import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import {
  DocumentDownloadNotAllowed,
  ReferenceDocumentNotFound,
} from '~api-contracts/modules/learning-content/errors.js'
import {
  GetReferenceDocumentParams,
  GetReferenceDocumentsParams,
  LinkedQuestionsQuery,
  ReferenceDocumentsQuery,
} from '~api-contracts/modules/learning-content/requests.js'
import {
  DocumentPdfResponse,
  DocumentQuestionCountsResponse,
  DocumentSectionsResponse,
  LinkedOralQuestionsResponse,
  LinkedWrittenQuestionsResponse,
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

export const GetDocumentQuestionCountsEndpoint = HttpApiEndpoint.get(
  'GetDocumentQuestionCounts',
  '/paths/:qualificationPathId/documents/:code/question-counts',
  {
    params: GetReferenceDocumentParams,
    success: DocumentQuestionCountsResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, ReferenceDocumentNotFound],
  },
)

export const GetLinkedWrittenQuestionsEndpoint = HttpApiEndpoint.get(
  'GetLinkedWrittenQuestions',
  '/paths/:qualificationPathId/documents/:code/written-questions',
  {
    params: GetReferenceDocumentParams,
    query: LinkedQuestionsQuery,
    success: LinkedWrittenQuestionsResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      InvalidRequest,
      PathAccessDenied,
      ReferenceDocumentNotFound,
    ],
  },
)

export const GetLinkedOralQuestionsEndpoint = HttpApiEndpoint.get(
  'GetLinkedOralQuestions',
  '/paths/:qualificationPathId/documents/:code/oral-questions',
  {
    params: GetReferenceDocumentParams,
    query: LinkedQuestionsQuery,
    success: LinkedOralQuestionsResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      InvalidRequest,
      PathAccessDenied,
      ReferenceDocumentNotFound,
    ],
  },
)

export const SourcesApi = HttpApiGroup.make('Sources')
  .add(GetReferenceDocumentsEndpoint)
  .add(GetReferenceDocumentEndpoint)
  .add(GetDocumentSectionsEndpoint)
  .add(GetDocumentPdfEndpoint)
  .add(GetDocumentPdfDownloadEndpoint)
  .add(GetDocumentQuestionCountsEndpoint)
  .add(GetLinkedWrittenQuestionsEndpoint)
  .add(GetLinkedOralQuestionsEndpoint)
  .middleware(Authentication)
  .prefix('/sources')
