import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import {
  DocumentNotFound,
  InvalidSessionAnswer,
  SessionAnswerAlreadySubmitted,
  SessionQuestionNotFound,
  SessionQuestionWithdrawn,
  StaleSessionPreview,
  StudySessionAlreadyStarted,
  StudySessionEnded,
  StudySessionNotFound,
} from './errors.js'
import {
  DocumentsQuery,
  GetDocumentsParams,
  GetDocumentParams,
  LatestSessionQuery,
  SessionPreviewQuery,
  OralMaterialsQuery,
  SessionParams,
  SessionQuestionParams,
  SessionResultsQuery,
  StartSessionPayload,
  SubmitSessionAnswerPayload,
} from './requests.js'
import {
  DocumentResponse,
  DocumentsResponse,
  EndSessionResponse,
  LatestStudySessionResponse,
  OralMaterialsResponse,
  SessionPreviewResponse,
  SessionQuestionResponse,
  SessionResultsResponse,
  StartSessionResponse,
  StudySessionSummaryResponse,
  StudySessionResponse,
  RecordSessionAssistanceResponse,
  SubmitSessionAnswerResponse,
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

// Only an ended session has a summary; an unfinished one reads as null.
export const GetSessionSummaryEndpoint = HttpApiEndpoint.get(
  'GetSessionSummary',
  '/paths/:qualificationPathId/sessions/:sessionId/summary',
  {
    params: SessionParams,
    success: StudySessionSummaryResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// The per-question details of an ended session's summary, in session order.
export const GetSessionResultsEndpoint = HttpApiEndpoint.get(
  'GetSessionResults',
  '/paths/:qualificationPathId/sessions/:sessionId/results',
  {
    params: SessionParams,
    query: SessionResultsQuery,
    success: SessionResultsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, PathAccessDenied],
  },
)

// Ends a session before its summary; it keeps its answers and accepts no more. Ending an ended one changes nothing.
export const EndSessionEndpoint = HttpApiEndpoint.post(
  'EndSession',
  '/paths/:qualificationPathId/sessions/:sessionId/end',
  {
    params: SessionParams,
    success: EndSessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, StudySessionNotFound],
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

// Opening the explanation before submitting is recorded once; the answer is then assisted (ADR-0002).
export const RecordSessionAssistanceEndpoint = HttpApiEndpoint.post(
  'RecordSessionAssistance',
  '/paths/:qualificationPathId/sessions/:sessionId/questions/:position/assistance',
  {
    params: SessionQuestionParams,
    success: RecordSessionAssistanceResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, SessionQuestionNotFound],
  },
)

// Retrying the same answer returns the stored result; a different answer after it is refused.
export const SubmitSessionAnswerEndpoint = HttpApiEndpoint.post(
  'SubmitSessionAnswer',
  '/paths/:qualificationPathId/sessions/:sessionId/questions/:position/answer',
  {
    params: SessionQuestionParams,
    payload: SubmitSessionAnswerPayload,
    success: SubmitSessionAnswerResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      SessionQuestionNotFound,
      StudySessionEnded,
      SessionQuestionWithdrawn,
      InvalidSessionAnswer,
      SessionAnswerAlreadySubmitted,
    ],
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
  .add(GetSessionSummaryEndpoint)
  .add(GetSessionResultsEndpoint)
  .add(EndSessionEndpoint)
  .add(GetSessionQuestionEndpoint)
  .add(RecordSessionAssistanceEndpoint)
  .add(SubmitSessionAnswerEndpoint)
  .middleware(Authentication)
  .prefix('/study')
