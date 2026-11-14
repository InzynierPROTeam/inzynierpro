import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import { DocumentNotFound, StaleSessionPreview, StudySessionAlreadyStarted } from './errors.js'
import {
  DocumentsQuery,
  GetDocumentsParams,
  GetDocumentParams,
  LatestSessionQuery,
  SessionPreviewQuery,
  OralMaterialsQuery,
  SessionParams,
  SessionQuestionParams,
  StartSessionPayload,
} from './requests.js'
import {
  DocumentResponse,
  DocumentsResponse,
  LatestStudySessionResponse,
  OralMaterialsResponse,
  SessionPreviewResponse,
  SessionQuestionResponse,
  StartSessionResponse,
  StudySessionResponse,
} from './responses.js'

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

export const GetDocumentEndpoint = HttpApiEndpoint.get(
  'GetDocument',
  '/paths/:qualificationPathId/documents/:documentId',
  {
    params: GetDocumentParams,
    success: DocumentResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, DocumentNotFound],
  },
)

export const GetSessionPreviewEndpoint = HttpApiEndpoint.get(
  'GetSessionPreview',
  '/paths/:qualificationPathId/preview',
  {
    params: GetDocumentsParams,
    query: SessionPreviewQuery,
    success: SessionPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
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

export const StartSessionEndpoint = HttpApiEndpoint.post(
  'StartSession',
  '/paths/:qualificationPathId/sessions',
  {
    params: GetDocumentsParams,
    payload: StartSessionPayload,
    success: StartSessionResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      DocumentNotFound,
      StaleSessionPreview,
      StudySessionAlreadyStarted,
    ],
  },
)

export const GetLatestSessionEndpoint = HttpApiEndpoint.get(
  'GetLatestSession',
  '/paths/:qualificationPathId/latest-session',
  {
    params: GetDocumentsParams,
    query: LatestSessionQuery,
    success: LatestStudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetSessionEndpoint = HttpApiEndpoint.get(
  'GetSession',
  '/paths/:qualificationPathId/sessions/:sessionId',
  {
    params: SessionParams,
    success: StudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetSessionQuestionEndpoint = HttpApiEndpoint.get(
  'GetSessionQuestion',
  '/paths/:qualificationPathId/sessions/:sessionId/questions/:position',
  {
    params: SessionQuestionParams,
    success: SessionQuestionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const StudyApi = HttpApiGroup.make('Study')
  .add(GetDocumentsEndpoint)
  .add(GetDocumentEndpoint)
  .add(GetSessionPreviewEndpoint)
  .add(GetOralMaterialsEndpoint)
  .add(StartSessionEndpoint)
  .add(GetLatestSessionEndpoint)
  .add(GetSessionEndpoint)
  .add(GetSessionQuestionEndpoint)
  .middleware(Authentication)
  .prefix('/study')
