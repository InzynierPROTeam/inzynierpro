import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import { DocumentNotFound } from './errors.js'
import {
  DocumentsQuery,
  GetDocumentsParams,
  GetSessionPreviewParams,
  OralMaterialsQuery,
} from './requests.js'
import { DocumentsResponse, OralMaterialsResponse, SessionPreview } from './responses.js'

export const GetDocumentsEndpoint = HttpApiEndpoint.get(
  'GetDocuments',
  '/paths/:qualificationPathId/documents',
  {
    params: GetDocumentsParams,
    query: DocumentsQuery,
    success: DocumentsResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      InvalidRequest,
      PathAccessDenied,
      DocumentNotFound,
    ],
  },
)

export const GetSessionPreviewEndpoint = HttpApiEndpoint.get(
  'GetSessionPreview',
  '/paths/:qualificationPathId/documents/:documentId/preview',
  {
    params: GetSessionPreviewParams,
    success: SessionPreview,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, DocumentNotFound],
  },
)

export const GetOralMaterialsEndpoint = HttpApiEndpoint.get(
  'GetOralMaterials',
  '/paths/:qualificationPathId/oral',
  {
    params: GetDocumentsParams,
    query: OralMaterialsQuery,
    success: OralMaterialsResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      InvalidRequest,
      PathAccessDenied,
      DocumentNotFound,
    ],
  },
)

export const StudyApi = HttpApiGroup.make('Study')
  .add(GetDocumentsEndpoint)
  .add(GetSessionPreviewEndpoint)
  .add(GetOralMaterialsEndpoint)
  .middleware(Authentication)
  .prefix('/study')
