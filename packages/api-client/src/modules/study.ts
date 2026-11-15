import type {
  GetDocumentsEndpoint,
  GetDocumentEndpoint,
  GetSessionPreviewEndpoint,
  GetOralMaterialsEndpoint,
  StartSessionEndpoint,
  GetLatestSessionEndpoint,
  GetSessionEndpoint,
  GetSessionSummaryEndpoint,
  GetSessionResultsEndpoint,
  EndSessionEndpoint,
  GetSessionQuestionEndpoint,
  RecordSessionAssistanceEndpoint,
  SubmitSessionAnswerEndpoint,
} from '@inzpro/api-contracts/modules/study/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getDocuments = (req: GetDocumentsRequest) =>
  apiAction(api => api.Study.GetDocuments(req))

export type GetDocumentsRequest = InferEndpointRequest<typeof GetDocumentsEndpoint>

export type GetDocumentsRes = Effect.Success<ReturnType<typeof getDocuments>>

export type GetDocumentsError = Effect.Error<ReturnType<typeof getDocuments>>

export const getSessionPreview = (req: GetSessionPreviewRequest) =>
  apiAction(api => api.Study.GetSessionPreview(req))

export type GetSessionPreviewRequest = InferEndpointRequest<typeof GetSessionPreviewEndpoint>

export type GetSessionPreviewRes = Effect.Success<ReturnType<typeof getSessionPreview>>

export type GetSessionPreviewError = Effect.Error<ReturnType<typeof getSessionPreview>>

export const getOralMaterials = (req: GetOralMaterialsRequest) =>
  apiAction(api => api.Study.GetOralMaterials(req))

export type GetOralMaterialsRequest = InferEndpointRequest<typeof GetOralMaterialsEndpoint>

export type GetOralMaterialsRes = Effect.Success<ReturnType<typeof getOralMaterials>>

export type GetOralMaterialsError = Effect.Error<ReturnType<typeof getOralMaterials>>

export const getDocument = (req: GetDocumentRequest) => apiAction(api => api.Study.GetDocument(req))

export type GetDocumentRequest = InferEndpointRequest<typeof GetDocumentEndpoint>

export type GetDocumentRes = Effect.Success<ReturnType<typeof getDocument>>

export type GetDocumentError = Effect.Error<ReturnType<typeof getDocument>>

export const startSession = (req: StartSessionRequest) =>
  apiAction(api => api.Study.StartSession(req))

export type StartSessionRequest = InferEndpointRequest<typeof StartSessionEndpoint>

export type StartSessionRes = Effect.Success<ReturnType<typeof startSession>>

export type StartSessionError = Effect.Error<ReturnType<typeof startSession>>

export const getLatestSession = (req: GetLatestSessionRequest) =>
  apiAction(api => api.Study.GetLatestSession(req))

export type GetLatestSessionRequest = InferEndpointRequest<typeof GetLatestSessionEndpoint>

export type GetLatestSessionRes = Effect.Success<ReturnType<typeof getLatestSession>>

export type GetLatestSessionError = Effect.Error<ReturnType<typeof getLatestSession>>

export const getSession = (req: GetSessionRequest) => apiAction(api => api.Study.GetSession(req))

export type GetSessionRequest = InferEndpointRequest<typeof GetSessionEndpoint>

export type GetSessionRes = Effect.Success<ReturnType<typeof getSession>>

export type GetSessionError = Effect.Error<ReturnType<typeof getSession>>

export const getSessionSummary = (req: GetSessionSummaryRequest) =>
  apiAction(api => api.Study.GetSessionSummary(req))

export type GetSessionSummaryRequest = InferEndpointRequest<typeof GetSessionSummaryEndpoint>

export type GetSessionSummaryRes = Effect.Success<ReturnType<typeof getSessionSummary>>

export type GetSessionSummaryError = Effect.Error<ReturnType<typeof getSessionSummary>>

export const getSessionResults = (req: GetSessionResultsRequest) =>
  apiAction(api => api.Study.GetSessionResults(req))

export type GetSessionResultsRequest = InferEndpointRequest<typeof GetSessionResultsEndpoint>

export type GetSessionResultsRes = Effect.Success<ReturnType<typeof getSessionResults>>

export type GetSessionResultsError = Effect.Error<ReturnType<typeof getSessionResults>>

export const endSession = (req: EndSessionRequest) => apiAction(api => api.Study.EndSession(req))

export type EndSessionRequest = InferEndpointRequest<typeof EndSessionEndpoint>

export type EndSessionRes = Effect.Success<ReturnType<typeof endSession>>

export type EndSessionError = Effect.Error<ReturnType<typeof endSession>>

export const getSessionQuestion = (req: GetSessionQuestionRequest) =>
  apiAction(api => api.Study.GetSessionQuestion(req))

export type GetSessionQuestionRequest = InferEndpointRequest<typeof GetSessionQuestionEndpoint>

export type GetSessionQuestionRes = Effect.Success<ReturnType<typeof getSessionQuestion>>

export type GetSessionQuestionError = Effect.Error<ReturnType<typeof getSessionQuestion>>

export const recordSessionAssistance = (req: RecordSessionAssistanceRequest) =>
  apiAction(api => api.Study.RecordSessionAssistance(req))

export type RecordSessionAssistanceRequest = InferEndpointRequest<
  typeof RecordSessionAssistanceEndpoint
>

export type RecordSessionAssistanceRes = Effect.Success<ReturnType<typeof recordSessionAssistance>>

export type RecordSessionAssistanceError = Effect.Error<ReturnType<typeof recordSessionAssistance>>

export const submitSessionAnswer = (req: SubmitSessionAnswerRequest) =>
  apiAction(api => api.Study.SubmitSessionAnswer(req))

export type SubmitSessionAnswerRequest = InferEndpointRequest<typeof SubmitSessionAnswerEndpoint>

export type SubmitSessionAnswerRes = Effect.Success<ReturnType<typeof submitSessionAnswer>>

export type SubmitSessionAnswerError = Effect.Error<ReturnType<typeof submitSessionAnswer>>
