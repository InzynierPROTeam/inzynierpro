import type {
  GetDocumentsEndpoint,
  GetDocumentEndpoint,
  GetSessionPreviewEndpoint,
  GetOralMaterialsEndpoint,
  StartSessionEndpoint,
  GetReviewPreviewEndpoint,
  GetReviewSessionEndpoint,
  StartReviewSessionEndpoint,
  MarkFavoriteQuestionEndpoint,
  UnmarkFavoriteQuestionEndpoint,
  GetFavoritesPreviewEndpoint,
  GetFavoritesSessionEndpoint,
  StartFavoritesSessionEndpoint,
  GetLatestSessionEndpoint,
  GetSessionEndpoint,
  GetSessionSummaryEndpoint,
  GetSessionNextStepEndpoint,
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

export const getReviewPreview = (req: GetReviewPreviewRequest) =>
  apiAction(api => api.Study.GetReviewPreview(req))

export type GetReviewPreviewRequest = InferEndpointRequest<typeof GetReviewPreviewEndpoint>

export type GetReviewPreviewRes = Effect.Success<ReturnType<typeof getReviewPreview>>

export type GetReviewPreviewError = Effect.Error<ReturnType<typeof getReviewPreview>>

export const getReviewSession = (req: GetReviewSessionRequest) =>
  apiAction(api => api.Study.GetReviewSession(req))

export type GetReviewSessionRequest = InferEndpointRequest<typeof GetReviewSessionEndpoint>

export type GetReviewSessionRes = Effect.Success<ReturnType<typeof getReviewSession>>

export type GetReviewSessionError = Effect.Error<ReturnType<typeof getReviewSession>>

export const startReviewSession = (req: StartReviewSessionRequest) =>
  apiAction(api => api.Study.StartReviewSession(req))

export type StartReviewSessionRequest = InferEndpointRequest<typeof StartReviewSessionEndpoint>

export type StartReviewSessionRes = Effect.Success<ReturnType<typeof startReviewSession>>

export type StartReviewSessionError = Effect.Error<ReturnType<typeof startReviewSession>>

export const markFavoriteQuestion = (req: MarkFavoriteQuestionRequest) =>
  apiAction(api => api.Study.MarkFavoriteQuestion(req))

export type MarkFavoriteQuestionRequest = InferEndpointRequest<typeof MarkFavoriteQuestionEndpoint>

export type MarkFavoriteQuestionRes = Effect.Success<ReturnType<typeof markFavoriteQuestion>>

export type MarkFavoriteQuestionError = Effect.Error<ReturnType<typeof markFavoriteQuestion>>

export const unmarkFavoriteQuestion = (req: UnmarkFavoriteQuestionRequest) =>
  apiAction(api => api.Study.UnmarkFavoriteQuestion(req))

export type UnmarkFavoriteQuestionRequest = InferEndpointRequest<
  typeof UnmarkFavoriteQuestionEndpoint
>

export type UnmarkFavoriteQuestionRes = Effect.Success<ReturnType<typeof unmarkFavoriteQuestion>>

export type UnmarkFavoriteQuestionError = Effect.Error<ReturnType<typeof unmarkFavoriteQuestion>>

export const getFavoritesPreview = (req: GetFavoritesPreviewRequest) =>
  apiAction(api => api.Study.GetFavoritesPreview(req))

export type GetFavoritesPreviewRequest = InferEndpointRequest<typeof GetFavoritesPreviewEndpoint>

export type GetFavoritesPreviewRes = Effect.Success<ReturnType<typeof getFavoritesPreview>>

export type GetFavoritesPreviewError = Effect.Error<ReturnType<typeof getFavoritesPreview>>

export const getFavoritesSession = (req: GetFavoritesSessionRequest) =>
  apiAction(api => api.Study.GetFavoritesSession(req))

export type GetFavoritesSessionRequest = InferEndpointRequest<typeof GetFavoritesSessionEndpoint>

export type GetFavoritesSessionRes = Effect.Success<ReturnType<typeof getFavoritesSession>>

export type GetFavoritesSessionError = Effect.Error<ReturnType<typeof getFavoritesSession>>

export const startFavoritesSession = (req: StartFavoritesSessionRequest) =>
  apiAction(api => api.Study.StartFavoritesSession(req))

export type StartFavoritesSessionRequest = InferEndpointRequest<
  typeof StartFavoritesSessionEndpoint
>

export type StartFavoritesSessionRes = Effect.Success<ReturnType<typeof startFavoritesSession>>

export type StartFavoritesSessionError = Effect.Error<ReturnType<typeof startFavoritesSession>>

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

export const getSessionNextStep = (req: GetSessionNextStepRequest) =>
  apiAction(api => api.Study.GetSessionNextStep(req))

export type GetSessionNextStepRequest = InferEndpointRequest<typeof GetSessionNextStepEndpoint>

export type GetSessionNextStepRes = Effect.Success<ReturnType<typeof getSessionNextStep>>

export type GetSessionNextStepError = Effect.Error<ReturnType<typeof getSessionNextStep>>

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
