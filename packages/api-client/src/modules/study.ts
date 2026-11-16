import type {
  GetDocumentsEndpoint,
  GetDocumentEndpoint,
  GetSessionPreviewEndpoint,
  StartSessionEndpoint,
  GetReviewPreviewEndpoint,
  GetReviewSessionEndpoint,
  StartReviewSessionEndpoint,
  MarkFavoriteQuestionEndpoint,
  UnmarkFavoriteQuestionEndpoint,
  SaveQuestionNoteEndpoint,
  ClearQuestionNoteEndpoint,
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
import type {
  GetOralReviewPreviewEndpoint,
  GetOralReviewSessionEndpoint,
  StartOralReviewSessionEndpoint,
  EndOralSessionEndpoint,
  GetLatestOralSessionEndpoint,
  GetOralMaterialsEndpoint,
  GetOralSessionEndpoint,
  GetOralSessionNextStepEndpoint,
  GetOralSessionPreviewEndpoint,
  GetOralSessionQuestionEndpoint,
  GetOralSessionResultsEndpoint,
  GetOralSessionSummaryEndpoint,
  StartOralSessionEndpoint,
  SubmitOralSelfAssessmentEndpoint,
} from '@inzpro/api-contracts/modules/study/oral-api'
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

export const saveQuestionNote = (req: SaveQuestionNoteRequest) =>
  apiAction(api => api.Study.SaveQuestionNote(req))

export type SaveQuestionNoteRequest = InferEndpointRequest<typeof SaveQuestionNoteEndpoint>

export type SaveQuestionNoteRes = Effect.Success<ReturnType<typeof saveQuestionNote>>

export type SaveQuestionNoteError = Effect.Error<ReturnType<typeof saveQuestionNote>>

export const clearQuestionNote = (req: ClearQuestionNoteRequest) =>
  apiAction(api => api.Study.ClearQuestionNote(req))

export type ClearQuestionNoteRequest = InferEndpointRequest<typeof ClearQuestionNoteEndpoint>

export type ClearQuestionNoteRes = Effect.Success<ReturnType<typeof clearQuestionNote>>

export type ClearQuestionNoteError = Effect.Error<ReturnType<typeof clearQuestionNote>>

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

export const getOralMaterials = (req: GetOralMaterialsRequest) =>
  apiAction(api => api.OralStudy.GetOralMaterials(req))

export type GetOralMaterialsRequest = InferEndpointRequest<typeof GetOralMaterialsEndpoint>

export type GetOralMaterialsRes = Effect.Success<ReturnType<typeof getOralMaterials>>

export type GetOralMaterialsError = Effect.Error<ReturnType<typeof getOralMaterials>>

export const getOralSessionPreview = (req: GetOralSessionPreviewRequest) =>
  apiAction(api => api.OralStudy.GetOralSessionPreview(req))

export type GetOralSessionPreviewRequest = InferEndpointRequest<
  typeof GetOralSessionPreviewEndpoint
>

export type GetOralSessionPreviewRes = Effect.Success<ReturnType<typeof getOralSessionPreview>>

export type GetOralSessionPreviewError = Effect.Error<ReturnType<typeof getOralSessionPreview>>

export const startOralSession = (req: StartOralSessionRequest) =>
  apiAction(api => api.OralStudy.StartOralSession(req))

export type StartOralSessionRequest = InferEndpointRequest<typeof StartOralSessionEndpoint>

export type StartOralSessionRes = Effect.Success<ReturnType<typeof startOralSession>>

export type StartOralSessionError = Effect.Error<ReturnType<typeof startOralSession>>

export const getLatestOralSession = (req: GetLatestOralSessionRequest) =>
  apiAction(api => api.OralStudy.GetLatestOralSession(req))

export type GetLatestOralSessionRequest = InferEndpointRequest<typeof GetLatestOralSessionEndpoint>

export type GetLatestOralSessionRes = Effect.Success<ReturnType<typeof getLatestOralSession>>

export type GetLatestOralSessionError = Effect.Error<ReturnType<typeof getLatestOralSession>>

export const getOralSession = (req: GetOralSessionRequest) =>
  apiAction(api => api.OralStudy.GetOralSession(req))

export type GetOralSessionRequest = InferEndpointRequest<typeof GetOralSessionEndpoint>

export type GetOralSessionRes = Effect.Success<ReturnType<typeof getOralSession>>

export type GetOralSessionError = Effect.Error<ReturnType<typeof getOralSession>>

export const getOralSessionNextStep = (req: GetOralSessionNextStepRequest) =>
  apiAction(api => api.OralStudy.GetOralSessionNextStep(req))

export type GetOralSessionNextStepRequest = InferEndpointRequest<
  typeof GetOralSessionNextStepEndpoint
>

export type GetOralSessionNextStepRes = Effect.Success<ReturnType<typeof getOralSessionNextStep>>

export type GetOralSessionNextStepError = Effect.Error<ReturnType<typeof getOralSessionNextStep>>

export const getOralSessionSummary = (req: GetOralSessionSummaryRequest) =>
  apiAction(api => api.OralStudy.GetOralSessionSummary(req))

export type GetOralSessionSummaryRequest = InferEndpointRequest<
  typeof GetOralSessionSummaryEndpoint
>

export type GetOralSessionSummaryRes = Effect.Success<ReturnType<typeof getOralSessionSummary>>

export type GetOralSessionSummaryError = Effect.Error<ReturnType<typeof getOralSessionSummary>>

export const getOralSessionResults = (req: GetOralSessionResultsRequest) =>
  apiAction(api => api.OralStudy.GetOralSessionResults(req))

export type GetOralSessionResultsRequest = InferEndpointRequest<
  typeof GetOralSessionResultsEndpoint
>

export type GetOralSessionResultsRes = Effect.Success<ReturnType<typeof getOralSessionResults>>

export type GetOralSessionResultsError = Effect.Error<ReturnType<typeof getOralSessionResults>>

export const endOralSession = (req: EndOralSessionRequest) =>
  apiAction(api => api.OralStudy.EndOralSession(req))

export type EndOralSessionRequest = InferEndpointRequest<typeof EndOralSessionEndpoint>

export type EndOralSessionRes = Effect.Success<ReturnType<typeof endOralSession>>

export type EndOralSessionError = Effect.Error<ReturnType<typeof endOralSession>>

export const getOralSessionQuestion = (req: GetOralSessionQuestionRequest) =>
  apiAction(api => api.OralStudy.GetOralSessionQuestion(req))

export type GetOralSessionQuestionRequest = InferEndpointRequest<
  typeof GetOralSessionQuestionEndpoint
>

export type GetOralSessionQuestionRes = Effect.Success<ReturnType<typeof getOralSessionQuestion>>

export type GetOralSessionQuestionError = Effect.Error<ReturnType<typeof getOralSessionQuestion>>

export const submitOralSelfAssessment = (req: SubmitOralSelfAssessmentRequest) =>
  apiAction(api => api.OralStudy.SubmitOralSelfAssessment(req))

export type SubmitOralSelfAssessmentRequest = InferEndpointRequest<
  typeof SubmitOralSelfAssessmentEndpoint
>

export type SubmitOralSelfAssessmentRes = Effect.Success<
  ReturnType<typeof submitOralSelfAssessment>
>

export type SubmitOralSelfAssessmentError = Effect.Error<
  ReturnType<typeof submitOralSelfAssessment>
>

export const getOralReviewPreview = (req: GetOralReviewPreviewRequest) =>
  apiAction(api => api.OralStudy.GetOralReviewPreview(req))

export type GetOralReviewPreviewRequest = InferEndpointRequest<typeof GetOralReviewPreviewEndpoint>

export type GetOralReviewPreviewRes = Effect.Success<ReturnType<typeof getOralReviewPreview>>

export type GetOralReviewPreviewError = Effect.Error<ReturnType<typeof getOralReviewPreview>>

export const getOralReviewSession = (req: GetOralReviewSessionRequest) =>
  apiAction(api => api.OralStudy.GetOralReviewSession(req))

export type GetOralReviewSessionRequest = InferEndpointRequest<typeof GetOralReviewSessionEndpoint>

export type GetOralReviewSessionRes = Effect.Success<ReturnType<typeof getOralReviewSession>>

export type GetOralReviewSessionError = Effect.Error<ReturnType<typeof getOralReviewSession>>

export const startOralReviewSession = (req: StartOralReviewSessionRequest) =>
  apiAction(api => api.OralStudy.StartOralReviewSession(req))

export type StartOralReviewSessionRequest = InferEndpointRequest<
  typeof StartOralReviewSessionEndpoint
>

export type StartOralReviewSessionRes = Effect.Success<ReturnType<typeof startOralReviewSession>>

export type StartOralReviewSessionError = Effect.Error<ReturnType<typeof startOralReviewSession>>
