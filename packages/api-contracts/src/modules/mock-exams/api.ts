import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import {
  AttemptQuestionConflict,
  AttemptQuestionNotFound,
  AttemptQuestionWithdrawn,
  InvalidAttemptAnswer,
  MockExamAttemptNotInProgress,
  MockExamUnavailable,
} from '~api-contracts/modules/mock-exams/errors.js'
import {
  AttemptQuestionParams,
  FlagAttemptQuestionPayload,
  MockExamAttemptParams,
  MockExamPathParams,
  SaveAttemptAnswerPayload,
} from '~api-contracts/modules/mock-exams/requests.js'
import { MockExamPageQuery } from '~api-contracts/modules/mock-exams/requests.js'
import {
  AttemptReviewResponse,
  MockExamHistoryResponse,
} from '~api-contracts/modules/mock-exams/responses.js'
import {
  AttemptQuestionResponse,
  FlagAttemptQuestionResponse,
  MockExamAttemptResponse,
  MockExamPreviewResponse,
  SaveAttemptAnswerResponse,
  StartMockExamAttemptResponse,
} from '~api-contracts/modules/mock-exams/responses.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
import { InvalidRequest } from '~api-contracts/utils/api-error.js'
import { InternalServerError, RateLimitExceeded } from '~api-contracts/utils/api-error.js'

export const GetMockExamPreviewEndpoint = HttpApiEndpoint.get(
  'GetMockExamPreview',
  '/paths/:qualificationPathId/preview',
  {
    params: MockExamPathParams,
    success: MockExamPreviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const StartMockExamAttemptEndpoint = HttpApiEndpoint.post(
  'StartMockExamAttempt',
  '/paths/:qualificationPathId/attempts',
  {
    params: MockExamPathParams,
    success: StartMockExamAttemptResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, MockExamUnavailable],
  },
)

export const GetMockExamAttemptEndpoint = HttpApiEndpoint.get(
  'GetMockExamAttempt',
  '/paths/:qualificationPathId/attempts/:attemptId',
  {
    params: MockExamAttemptParams,
    success: MockExamAttemptResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const GetAttemptQuestionEndpoint = HttpApiEndpoint.get(
  'GetAttemptQuestion',
  '/paths/:qualificationPathId/attempts/:attemptId/questions/:position',
  {
    params: AttemptQuestionParams,
    success: AttemptQuestionResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

// CONTRACT: An otherwise valid write matching the current value ignores expectedVersion and returns the current version.
export const SaveAttemptAnswerEndpoint = HttpApiEndpoint.put(
  'SaveAttemptAnswer',
  '/paths/:qualificationPathId/attempts/:attemptId/questions/:position/answer',
  {
    params: AttemptQuestionParams,
    payload: SaveAttemptAnswerPayload,
    success: SaveAttemptAnswerResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      AttemptQuestionNotFound,
      MockExamAttemptNotInProgress,
      AttemptQuestionWithdrawn,
      InvalidAttemptAnswer,
      AttemptQuestionConflict,
    ],
  },
)

// CONTRACT: An otherwise valid write matching the current value ignores expectedVersion and returns the current version.
export const FlagAttemptQuestionEndpoint = HttpApiEndpoint.put(
  'FlagAttemptQuestion',
  '/paths/:qualificationPathId/attempts/:attemptId/questions/:position/flag',
  {
    params: AttemptQuestionParams,
    payload: FlagAttemptQuestionPayload,
    success: FlagAttemptQuestionResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      AttemptQuestionNotFound,
      MockExamAttemptNotInProgress,
      AttemptQuestionConflict,
    ],
  },
)

export const FinishMockExamAttemptEndpoint = HttpApiEndpoint.post(
  'FinishMockExamAttempt',
  '/paths/:qualificationPathId/attempts/:attemptId/finish',
  {
    params: MockExamAttemptParams,
    success: MockExamAttemptResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, MockExamAttemptNotInProgress],
  },
)

export const GetAttemptReviewEndpoint = HttpApiEndpoint.get(
  'GetAttemptReview',
  '/paths/:qualificationPathId/attempts/:attemptId/review',
  {
    params: MockExamAttemptParams,
    query: MockExamPageQuery,
    success: AttemptReviewResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, InvalidRequest],
  },
)

export const GetMockExamHistoryEndpoint = HttpApiEndpoint.get(
  'GetMockExamHistory',
  '/paths/:qualificationPathId/history',
  {
    params: MockExamPathParams,
    query: MockExamPageQuery,
    success: MockExamHistoryResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, InvalidRequest],
  },
)

export const MockExamsApi = HttpApiGroup.make('MockExams')
  .add(GetMockExamPreviewEndpoint)
  .add(StartMockExamAttemptEndpoint)
  .add(GetMockExamAttemptEndpoint)
  .add(GetAttemptQuestionEndpoint)
  .add(SaveAttemptAnswerEndpoint)
  .add(FlagAttemptQuestionEndpoint)
  .add(FinishMockExamAttemptEndpoint)
  .add(GetAttemptReviewEndpoint)
  .add(GetMockExamHistoryEndpoint)
  .middleware(Authentication)
  .prefix('/mock-exams')
