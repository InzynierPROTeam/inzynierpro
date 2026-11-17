import type {
  GetOralFavoritesPreviewEndpoint,
  GetOralFavoritesSessionEndpoint,
  StartOralFavoritesSessionEndpoint,
  MarkOralFavoriteQuestionEndpoint,
  UnmarkOralFavoriteQuestionEndpoint,
  SaveOralQuestionNoteEndpoint,
  ClearOralQuestionNoteEndpoint,
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
  GetOralSessionQuizEndpoint,
  StartOralSessionQuizEndpoint,
  GetOralQuizChecksEndpoint,
  AnswerOralQuizCheckEndpoint,
} from '@inzpro/api-contracts/modules/oral-study/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

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

export const getOralFavoritesPreview = (req: GetOralFavoritesPreviewRequest) =>
  apiAction(api => api.OralStudy.GetOralFavoritesPreview(req))

export type GetOralFavoritesPreviewRequest = InferEndpointRequest<
  typeof GetOralFavoritesPreviewEndpoint
>

export type GetOralFavoritesPreviewRes = Effect.Success<ReturnType<typeof getOralFavoritesPreview>>

export type GetOralFavoritesPreviewError = Effect.Error<ReturnType<typeof getOralFavoritesPreview>>

export const getOralFavoritesSession = (req: GetOralFavoritesSessionRequest) =>
  apiAction(api => api.OralStudy.GetOralFavoritesSession(req))

export type GetOralFavoritesSessionRequest = InferEndpointRequest<
  typeof GetOralFavoritesSessionEndpoint
>

export type GetOralFavoritesSessionRes = Effect.Success<ReturnType<typeof getOralFavoritesSession>>

export type GetOralFavoritesSessionError = Effect.Error<ReturnType<typeof getOralFavoritesSession>>

export const startOralFavoritesSession = (req: StartOralFavoritesSessionRequest) =>
  apiAction(api => api.OralStudy.StartOralFavoritesSession(req))

export type StartOralFavoritesSessionRequest = InferEndpointRequest<
  typeof StartOralFavoritesSessionEndpoint
>

export type StartOralFavoritesSessionRes = Effect.Success<
  ReturnType<typeof startOralFavoritesSession>
>

export type StartOralFavoritesSessionError = Effect.Error<
  ReturnType<typeof startOralFavoritesSession>
>

export const markOralFavoriteQuestion = (req: MarkOralFavoriteQuestionRequest) =>
  apiAction(api => api.OralStudy.MarkOralFavoriteQuestion(req))

export type MarkOralFavoriteQuestionRequest = InferEndpointRequest<
  typeof MarkOralFavoriteQuestionEndpoint
>

export type MarkOralFavoriteQuestionRes = Effect.Success<
  ReturnType<typeof markOralFavoriteQuestion>
>

export type MarkOralFavoriteQuestionError = Effect.Error<
  ReturnType<typeof markOralFavoriteQuestion>
>

export const unmarkOralFavoriteQuestion = (req: UnmarkOralFavoriteQuestionRequest) =>
  apiAction(api => api.OralStudy.UnmarkOralFavoriteQuestion(req))

export type UnmarkOralFavoriteQuestionRequest = InferEndpointRequest<
  typeof UnmarkOralFavoriteQuestionEndpoint
>

export type UnmarkOralFavoriteQuestionRes = Effect.Success<
  ReturnType<typeof unmarkOralFavoriteQuestion>
>

export type UnmarkOralFavoriteQuestionError = Effect.Error<
  ReturnType<typeof unmarkOralFavoriteQuestion>
>

export const saveOralQuestionNote = (req: SaveOralQuestionNoteRequest) =>
  apiAction(api => api.OralStudy.SaveOralQuestionNote(req))

export type SaveOralQuestionNoteRequest = InferEndpointRequest<typeof SaveOralQuestionNoteEndpoint>

export type SaveOralQuestionNoteRes = Effect.Success<ReturnType<typeof saveOralQuestionNote>>

export type SaveOralQuestionNoteError = Effect.Error<ReturnType<typeof saveOralQuestionNote>>

export const clearOralQuestionNote = (req: ClearOralQuestionNoteRequest) =>
  apiAction(api => api.OralStudy.ClearOralQuestionNote(req))

export type ClearOralQuestionNoteRequest = InferEndpointRequest<
  typeof ClearOralQuestionNoteEndpoint
>

export type ClearOralQuestionNoteRes = Effect.Success<ReturnType<typeof clearOralQuestionNote>>

export type ClearOralQuestionNoteError = Effect.Error<ReturnType<typeof clearOralQuestionNote>>

export const getOralSessionQuiz = (req: GetOralSessionQuizRequest) =>
  apiAction(api => api.OralStudy.GetOralSessionQuiz(req))

export type GetOralSessionQuizRequest = InferEndpointRequest<typeof GetOralSessionQuizEndpoint>

export type GetOralSessionQuizRes = Effect.Success<ReturnType<typeof getOralSessionQuiz>>

export type GetOralSessionQuizError = Effect.Error<ReturnType<typeof getOralSessionQuiz>>

export const startOralSessionQuiz = (req: StartOralSessionQuizRequest) =>
  apiAction(api => api.OralStudy.StartOralSessionQuiz(req))

export type StartOralSessionQuizRequest = InferEndpointRequest<typeof StartOralSessionQuizEndpoint>

export type StartOralSessionQuizRes = Effect.Success<ReturnType<typeof startOralSessionQuiz>>

export type StartOralSessionQuizError = Effect.Error<ReturnType<typeof startOralSessionQuiz>>

export const getOralQuizChecks = (req: GetOralQuizChecksRequest) =>
  apiAction(api => api.OralStudy.GetOralQuizChecks(req))

export type GetOralQuizChecksRequest = InferEndpointRequest<typeof GetOralQuizChecksEndpoint>

export type GetOralQuizChecksRes = Effect.Success<ReturnType<typeof getOralQuizChecks>>

export type GetOralQuizChecksError = Effect.Error<ReturnType<typeof getOralQuizChecks>>

export const answerOralQuizCheck = (req: AnswerOralQuizCheckRequest) =>
  apiAction(api => api.OralStudy.AnswerOralQuizCheck(req))

export type AnswerOralQuizCheckRequest = InferEndpointRequest<typeof AnswerOralQuizCheckEndpoint>

export type AnswerOralQuizCheckRes = Effect.Success<ReturnType<typeof answerOralQuizCheck>>

export type AnswerOralQuizCheckError = Effect.Error<ReturnType<typeof answerOralQuizCheck>>
