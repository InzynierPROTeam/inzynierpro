import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import { MockExamUnavailable } from '~api-contracts/modules/mock-exams/errors.js'
import {
  AttemptQuestionParams,
  MockExamAttemptParams,
  MockExamPathParams,
} from '~api-contracts/modules/mock-exams/requests.js'
import {
  AttemptQuestionResponse,
  MockExamAttemptResponse,
  MockExamPreviewResponse,
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

// CONTRACT: Returns the unfinished attempt of the path when one exists instead of starting another.
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

export const MockExamsApi = HttpApiGroup.make('MockExams')
  .add(GetMockExamPreviewEndpoint)
  .add(StartMockExamAttemptEndpoint)
  .add(GetMockExamAttemptEndpoint)
  .add(GetAttemptQuestionEndpoint)
  .middleware(Authentication)
  .prefix('/mock-exams')
