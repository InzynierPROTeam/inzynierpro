import type {
  FinishMockExamAttemptEndpoint,
  GetAttemptReviewEndpoint,
  GetMockExamHistoryEndpoint,
  FlagAttemptQuestionEndpoint,
  GetAttemptQuestionEndpoint,
  GetMockExamAttemptEndpoint,
  GetMockExamPreviewEndpoint,
  SaveAttemptAnswerEndpoint,
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

export const saveAttemptAnswer = (req: SaveAttemptAnswerRequest) =>
  apiAction(api => api.MockExams.SaveAttemptAnswer(req))

export type SaveAttemptAnswerRequest = InferEndpointRequest<typeof SaveAttemptAnswerEndpoint>

export type SaveAttemptAnswerRes = Effect.Success<ReturnType<typeof saveAttemptAnswer>>

export type SaveAttemptAnswerError = Effect.Error<ReturnType<typeof saveAttemptAnswer>>

export const flagAttemptQuestion = (req: FlagAttemptQuestionRequest) =>
  apiAction(api => api.MockExams.FlagAttemptQuestion(req))

export type FlagAttemptQuestionRequest = InferEndpointRequest<typeof FlagAttemptQuestionEndpoint>

export type FlagAttemptQuestionRes = Effect.Success<ReturnType<typeof flagAttemptQuestion>>

export type FlagAttemptQuestionError = Effect.Error<ReturnType<typeof flagAttemptQuestion>>

export const finishMockExamAttempt = (req: FinishMockExamAttemptRequest) =>
  apiAction(api => api.MockExams.FinishMockExamAttempt(req))

export type FinishMockExamAttemptRequest = InferEndpointRequest<
  typeof FinishMockExamAttemptEndpoint
>

export type FinishMockExamAttemptRes = Effect.Success<ReturnType<typeof finishMockExamAttempt>>

export type FinishMockExamAttemptError = Effect.Error<ReturnType<typeof finishMockExamAttempt>>

export const getAttemptReview = (req: GetAttemptReviewRequest) =>
  apiAction(api => api.MockExams.GetAttemptReview(req))

export type GetAttemptReviewRequest = InferEndpointRequest<typeof GetAttemptReviewEndpoint>

export type GetAttemptReviewRes = Effect.Success<ReturnType<typeof getAttemptReview>>

export type GetAttemptReviewError = Effect.Error<ReturnType<typeof getAttemptReview>>

export const getMockExamHistory = (req: GetMockExamHistoryRequest) =>
  apiAction(api => api.MockExams.GetMockExamHistory(req))

export type GetMockExamHistoryRequest = InferEndpointRequest<typeof GetMockExamHistoryEndpoint>

export type GetMockExamHistoryRes = Effect.Success<ReturnType<typeof getMockExamHistory>>

export type GetMockExamHistoryError = Effect.Error<ReturnType<typeof getMockExamHistory>>
