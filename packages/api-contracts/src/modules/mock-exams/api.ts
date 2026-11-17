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
import {
  AttemptQuestionResponse,
  FlagAttemptQuestionResponse,
  MockExamAttemptResponse,
  MockExamPreviewResponse,
  SaveAttemptAnswerResponse,
  StartMockExamAttemptResponse,
} from '~api-contracts/modules/mock-exams/responses.js'
import { PathAccessDenied } from '~api-contracts/modules/preparation/errors.js'
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

// CONTRACT: A write the question already reflects succeeds with its current version, whatever expectedVersion it carries.
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

// CONTRACT: A write the question already reflects succeeds with its current version, whatever expectedVersion it carries.
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

export const MockExamsApi = HttpApiGroup.make('MockExams')
  .add(GetMockExamPreviewEndpoint)
  .add(StartMockExamAttemptEndpoint)
  .add(GetMockExamAttemptEndpoint)
  .add(GetAttemptQuestionEndpoint)
  .add(SaveAttemptAnswerEndpoint)
  .add(FlagAttemptQuestionEndpoint)
  .middleware(Authentication)
  .prefix('/mock-exams')
