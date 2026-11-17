import type {
  GetAttemptQuestionEndpoint,
  GetMockExamAttemptEndpoint,
  GetMockExamPreviewEndpoint,
  StartMockExamAttemptEndpoint,
} from '@inzpro/api-contracts/modules/mock-exams/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getMockExamPreview = (req: GetMockExamPreviewRequest) =>
  apiAction(api => api.MockExams.GetMockExamPreview(req))

export type GetMockExamPreviewRequest = InferEndpointRequest<typeof GetMockExamPreviewEndpoint>

export type GetMockExamPreviewRes = Effect.Success<ReturnType<typeof getMockExamPreview>>

export type GetMockExamPreviewError = Effect.Error<ReturnType<typeof getMockExamPreview>>

export const startMockExamAttempt = (req: StartMockExamAttemptRequest) =>
  apiAction(api => api.MockExams.StartMockExamAttempt(req))

export type StartMockExamAttemptRequest = InferEndpointRequest<typeof StartMockExamAttemptEndpoint>

export type StartMockExamAttemptRes = Effect.Success<ReturnType<typeof startMockExamAttempt>>

export type StartMockExamAttemptError = Effect.Error<ReturnType<typeof startMockExamAttempt>>

export const getMockExamAttempt = (req: GetMockExamAttemptRequest) =>
  apiAction(api => api.MockExams.GetMockExamAttempt(req))

export type GetMockExamAttemptRequest = InferEndpointRequest<typeof GetMockExamAttemptEndpoint>

export type GetMockExamAttemptRes = Effect.Success<ReturnType<typeof getMockExamAttempt>>

export type GetMockExamAttemptError = Effect.Error<ReturnType<typeof getMockExamAttempt>>

export const getAttemptQuestion = (req: GetAttemptQuestionRequest) =>
  apiAction(api => api.MockExams.GetAttemptQuestion(req))

export type GetAttemptQuestionRequest = InferEndpointRequest<typeof GetAttemptQuestionEndpoint>

export type GetAttemptQuestionRes = Effect.Success<ReturnType<typeof getAttemptQuestion>>

export type GetAttemptQuestionError = Effect.Error<ReturnType<typeof getAttemptQuestion>>
