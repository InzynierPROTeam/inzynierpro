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
  QuestionNotFound,
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
  FavoriteQuestionParams,
  FavoritesScopeQuery,
  GetDocumentsParams,
  GetDocumentParams,
  LatestSessionQuery,
  SessionPreviewQuery,
  OralMaterialsQuery,
  ReviewScopeQuery,
  SessionParams,
  SessionQuestionParams,
  SessionResultsQuery,
  StartFavoritesSessionPayload,
  StartReviewSessionPayload,
  StartSessionPayload,
  SubmitSessionAnswerPayload,
} from './requests.js'
import {
  DocumentResponse,
  DocumentsResponse,
  EndSessionResponse,
  FavoriteQuestionResponse,
  FavoritesPreviewResponse,
  LatestStudySessionResponse,
  OralMaterialsResponse,
  ReviewPreviewResponse,
  SessionNextStepResponse,
  SessionPreviewResponse,
  SessionQuestionResponse,
  SessionResultsResponse,
  StartFavoritesSessionResponse,
  StartReviewSessionResponse,
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

// The questions due for review now on the path or one document, or when the next review is due.
export const GetReviewPreviewEndpoint = HttpApiEndpoint.get(
  'GetReviewPreview',
  '/paths/:qualificationPathId/review-preview',
  {
    params: GetDocumentsParams,
    query: ReviewScopeQuery,
    success: ReviewPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// The unfinished review session of the path or one document, which its tile resumes.
export const GetReviewSessionEndpoint = HttpApiEndpoint.get(
  'GetReviewSession',
  '/paths/:qualificationPathId/review-session',
  {
    params: GetDocumentsParams,
    query: ReviewScopeQuery,
    success: StudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// Starts a review session of the most overdue questions; its reads and answers use the session endpoints.
export const StartReviewSessionEndpoint = HttpApiEndpoint.post(
  'StartReviewSession',
  '/paths/:qualificationPathId/review-sessions',
  {
    params: GetDocumentsParams,
    payload: StartReviewSessionPayload,
    success: StartReviewSessionResponse,
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

// Marks the question as a FavoriteQuestion on every path of the learner; marking again changes nothing.
export const MarkFavoriteQuestionEndpoint = HttpApiEndpoint.put(
  'MarkFavoriteQuestion',
  '/paths/:qualificationPathId/favorites/:questionId',
  {
    params: FavoriteQuestionParams,
    success: FavoriteQuestionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, QuestionNotFound],
  },
)

// Removes the mark on every path, even for a question no longer on this one; started favourites
// sessions keep their questions.
export const UnmarkFavoriteQuestionEndpoint = HttpApiEndpoint.delete(
  'UnmarkFavoriteQuestion',
  '/paths/:qualificationPathId/favorites/:questionId',
  {
    params: FavoriteQuestionParams,
    success: FavoriteQuestionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// The FavoriteQuestions of the path or one document a favourites session may hold, with the count settings.
export const GetFavoritesPreviewEndpoint = HttpApiEndpoint.get(
  'GetFavoritesPreview',
  '/paths/:qualificationPathId/favorites-preview',
  {
    params: GetDocumentsParams,
    query: FavoritesScopeQuery,
    success: FavoritesPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// The unfinished favourites session of the path or one document, which its tile resumes.
export const GetFavoritesSessionEndpoint = HttpApiEndpoint.get(
  'GetFavoritesSession',
  '/paths/:qualificationPathId/favorites-session',
  {
    params: GetDocumentsParams,
    query: FavoritesScopeQuery,
    success: StudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// Starts a favourites session with its set fixed; its reads and answers use the session endpoints.
export const StartFavoritesSessionEndpoint = HttpApiEndpoint.post(
  'StartFavoritesSession',
  '/paths/:qualificationPathId/favorites-sessions',
  {
    params: GetDocumentsParams,
    payload: StartFavoritesSessionPayload,
    success: StartFavoritesSessionResponse,
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

// What to do after the session, by the learner's state now; another account's session reads as null.
export const GetSessionNextStepEndpoint = HttpApiEndpoint.get(
  'GetSessionNextStep',
  '/paths/:qualificationPathId/sessions/:sessionId/next-step',
  {
    params: SessionParams,
    success: SessionNextStepResponse,
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
  .add(GetReviewPreviewEndpoint)
  .add(GetReviewSessionEndpoint)
  .add(StartReviewSessionEndpoint)
  .add(MarkFavoriteQuestionEndpoint)
  .add(UnmarkFavoriteQuestionEndpoint)
  .add(GetFavoritesPreviewEndpoint)
  .add(GetFavoritesSessionEndpoint)
  .add(StartFavoritesSessionEndpoint)
  .add(GetLatestSessionEndpoint)
  .add(GetSessionEndpoint)
  .add(GetSessionSummaryEndpoint)
  .add(GetSessionNextStepEndpoint)
  .add(GetSessionResultsEndpoint)
  .add(EndSessionEndpoint)
  .add(GetSessionQuestionEndpoint)
  .add(RecordSessionAssistanceEndpoint)
  .add(SubmitSessionAnswerEndpoint)
  .middleware(Authentication)
  .prefix('/study')
