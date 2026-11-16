import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import {
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
      InvalidOralSelfAssessment,
      OralSelfAssessmentAlreadySubmitted,
    ],
  },
)

export const OralStudyApi = HttpApiGroup.make('OralStudy')
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
