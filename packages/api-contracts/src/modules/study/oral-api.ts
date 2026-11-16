import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import {
  QuestionNotFound,
  InvalidOralSelfAssessment,
  OralCategoryNotFound,
  OralSelfAssessmentAlreadySubmitted,
  OralSessionAlreadyStarted,
  SessionQuestionNotFound,
  SessionQuestionWithdrawn,
  StaleSessionPreview,
  StudySessionEnded,
  StudySessionNotFound,
} from './errors.js'
import {
  SaveQuestionNotePayload,
  OralFavoriteQuestionParams,
  StartOralFavoritesSessionPayload,
  OralReviewScopeQuery,
  StartOralReviewSessionPayload,
  LatestOralSessionQuery,
  OralPathParams,
  OralSessionParams,
  OralSessionPreviewQuery,
  OralSessionQuestionParams,
  OralMaterialsQuery,
  OralSessionResultsQuery,
  StartOralSessionPayload,
  SubmitOralSelfAssessmentPayload,
} from './requests.js'
import {
  OralQuestionNoteResult,
  OralFavoriteQuestion,
  OralFavoritesPreviewResponse,
  OralReviewPreviewResponse,
  EndOralSessionResponse,
  OralMaterialsResponse,
  OralSessionNextStepResponse,
  OralSessionPreviewResponse,
  OralSessionQuestionResponse,
  OralSessionResultsResponse,
  OralStudySessionResponse,
  OralStudySessionSummaryResponse,
  StartOralSessionResponse,
  SubmitOralSelfAssessmentResponse,
} from './responses.js'

export const GetOralMaterialsEndpoint = HttpApiEndpoint.get(
  'GetOralMaterials',
  '/paths/:qualificationPathId/oral',
  {
    params: OralPathParams,
    query: OralMaterialsQuery,
    success: OralMaterialsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, PathAccessDenied],
  },
)

export const GetOralSessionPreviewEndpoint = HttpApiEndpoint.get(
  'GetOralSessionPreview',
  '/paths/:qualificationPathId/oral/preview',
  {
    params: OralPathParams,
    query: OralSessionPreviewQuery,
    success: OralSessionPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const StartOralSessionEndpoint = HttpApiEndpoint.post(
  'StartOralSession',
  '/paths/:qualificationPathId/oral/sessions',
  {
    params: OralPathParams,
    payload: StartOralSessionPayload,
    success: StartOralSessionResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      OralCategoryNotFound,
      StaleSessionPreview,
      OralSessionAlreadyStarted,
    ],
  },
)

export const GetLatestOralSessionEndpoint = HttpApiEndpoint.get(
  'GetLatestOralSession',
  '/paths/:qualificationPathId/oral/latest-session',
  {
    params: OralPathParams,
    query: LatestOralSessionQuery,
    success: OralStudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetOralSessionEndpoint = HttpApiEndpoint.get(
  'GetOralSession',
  '/paths/:qualificationPathId/oral/sessions/:sessionId',
  {
    params: OralSessionParams,
    success: OralStudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// CONTRACT: Another account's session returns null.
export const GetOralSessionNextStepEndpoint = HttpApiEndpoint.get(
  'GetOralSessionNextStep',
  '/paths/:qualificationPathId/oral/sessions/:sessionId/next-step',
  {
    params: OralSessionParams,
    success: OralSessionNextStepResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetOralSessionSummaryEndpoint = HttpApiEndpoint.get(
  'GetOralSessionSummary',
  '/paths/:qualificationPathId/oral/sessions/:sessionId/summary',
  {
    params: OralSessionParams,
    success: OralStudySessionSummaryResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetOralSessionResultsEndpoint = HttpApiEndpoint.get(
  'GetOralSessionResults',
  '/paths/:qualificationPathId/oral/sessions/:sessionId/results',
  {
    params: OralSessionParams,
    query: OralSessionResultsQuery,
    success: OralSessionResultsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, PathAccessDenied],
  },
)

// CONTRACT: Ending an already ended session is idempotent.
export const EndOralSessionEndpoint = HttpApiEndpoint.post(
  'EndOralSession',
  '/paths/:qualificationPathId/oral/sessions/:sessionId/end',
  {
    params: OralSessionParams,
    success: EndOralSessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, StudySessionNotFound],
  },
)

export const GetOralSessionQuestionEndpoint = HttpApiEndpoint.get(
  'GetOralSessionQuestion',
  '/paths/:qualificationPathId/oral/sessions/:sessionId/questions/:position',
  {
    params: OralSessionQuestionParams,
    success: OralSessionQuestionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// CONTRACT: Retrying the same self-assessment returns the stored result; a different assessment conflicts.
export const SubmitOralSelfAssessmentEndpoint = HttpApiEndpoint.post(
  'SubmitOralSelfAssessment',
  '/paths/:qualificationPathId/oral/sessions/:sessionId/questions/:position/self-assessment',
  {
    params: OralSessionQuestionParams,
    payload: SubmitOralSelfAssessmentPayload,
    success: SubmitOralSelfAssessmentResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      SessionQuestionNotFound,
      StudySessionEnded,
      SessionQuestionWithdrawn,
      QuestionNotFound,
      InvalidOralSelfAssessment,
      OralSelfAssessmentAlreadySubmitted,
    ],
  },
)

export const GetOralReviewPreviewEndpoint = HttpApiEndpoint.get(
  'GetOralReviewPreview',
  '/paths/:qualificationPathId/oral/review-preview',
  {
    params: OralPathParams,
    query: OralReviewScopeQuery,
    success: OralReviewPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetOralReviewSessionEndpoint = HttpApiEndpoint.get(
  'GetOralReviewSession',
  '/paths/:qualificationPathId/oral/review-session',
  {
    params: OralPathParams,
    query: OralReviewScopeQuery,
    success: OralStudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const StartOralReviewSessionEndpoint = HttpApiEndpoint.post(
  'StartOralReviewSession',
  '/paths/:qualificationPathId/oral/review-sessions',
  {
    params: OralPathParams,
    payload: StartOralReviewSessionPayload,
    success: StartOralSessionResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      OralCategoryNotFound,
      StaleSessionPreview,
      OralSessionAlreadyStarted,
    ],
  },
)

export const GetOralFavoritesPreviewEndpoint = HttpApiEndpoint.get(
  'GetOralFavoritesPreview',
  '/paths/:qualificationPathId/oral/favorites-preview',
  {
    params: OralPathParams,
    success: OralFavoritesPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetOralFavoritesSessionEndpoint = HttpApiEndpoint.get(
  'GetOralFavoritesSession',
  '/paths/:qualificationPathId/oral/favorites-session',
  {
    params: OralPathParams,
    success: OralStudySessionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const StartOralFavoritesSessionEndpoint = HttpApiEndpoint.post(
  'StartOralFavoritesSession',
  '/paths/:qualificationPathId/oral/favorites-sessions',
  {
    params: OralPathParams,
    payload: StartOralFavoritesSessionPayload,
    success: StartOralSessionResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      StaleSessionPreview,
      OralSessionAlreadyStarted,
    ],
  },
)

export const MarkOralFavoriteQuestionEndpoint = HttpApiEndpoint.put(
  'MarkOralFavoriteQuestion',
  '/paths/:qualificationPathId/oral/favorites/:questionId',
  {
    params: OralFavoriteQuestionParams,
    success: OralFavoriteQuestion,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, QuestionNotFound],
  },
)

export const UnmarkOralFavoriteQuestionEndpoint = HttpApiEndpoint.delete(
  'UnmarkOralFavoriteQuestion',
  '/paths/:qualificationPathId/oral/favorites/:questionId',
  {
    params: OralFavoriteQuestionParams,
    success: OralFavoriteQuestion,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, QuestionNotFound],
  },
)

export const SaveOralQuestionNoteEndpoint = HttpApiEndpoint.put(
  'SaveOralQuestionNote',
  '/paths/:qualificationPathId/oral/notes/:questionId',
  {
    params: OralFavoriteQuestionParams,
    payload: SaveQuestionNotePayload,
    success: OralQuestionNoteResult,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, QuestionNotFound],
  },
)

export const ClearOralQuestionNoteEndpoint = HttpApiEndpoint.delete(
  'ClearOralQuestionNote',
  '/paths/:qualificationPathId/oral/notes/:questionId',
  {
    params: OralFavoriteQuestionParams,
    success: OralQuestionNoteResult,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, QuestionNotFound],
  },
)

export const OralStudyApi = HttpApiGroup.make('OralStudy')
  .add(ClearOralQuestionNoteEndpoint)
  .add(SaveOralQuestionNoteEndpoint)
  .add(UnmarkOralFavoriteQuestionEndpoint)
  .add(MarkOralFavoriteQuestionEndpoint)
  .add(GetOralFavoritesPreviewEndpoint)
  .add(GetOralFavoritesSessionEndpoint)
  .add(StartOralFavoritesSessionEndpoint)
  .add(GetOralReviewPreviewEndpoint)
  .add(GetOralReviewSessionEndpoint)
  .add(StartOralReviewSessionEndpoint)
  .add(GetOralMaterialsEndpoint)
  .add(GetOralSessionPreviewEndpoint)
  .add(StartOralSessionEndpoint)
  .add(GetLatestOralSessionEndpoint)
  .add(GetOralSessionEndpoint)
  .add(GetOralSessionNextStepEndpoint)
  .add(GetOralSessionSummaryEndpoint)
  .add(GetOralSessionResultsEndpoint)
  .add(EndOralSessionEndpoint)
  .add(GetOralSessionQuestionEndpoint)
  .add(SubmitOralSelfAssessmentEndpoint)
  .middleware(Authentication)
  .prefix('/study')
