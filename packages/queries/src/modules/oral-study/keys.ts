import type {
  GetOralFavoritesPreviewRequest,
  GetOralQuestionDetailsRequest,
  GetOralFavoritesSessionRequest,
  GetOralDailyPlanRequest,
  GetOralReviewPreviewRequest,
  GetOralReviewSessionRequest,
  GetOralMaterialsRequest,
  GetOralSessionPreviewRequest,
  GetLatestOralSessionRequest,
  GetOralSessionRequest,
  GetOralSessionNextStepRequest,
  GetOralSessionSummaryRequest,
  GetOralSessionResultsRequest,
  GetOralSessionQuestionRequest,
  GetOralSessionQuizRequest,
  GetOralQuizChecksRequest,
} from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

export const oralStudyKeys = {
  all: ['oral-study'] as const,
  account: (userId: UserId) => [...oralStudyKeys.all, 'account', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...oralStudyKeys.account(userId), 'path', id] as const,
  oralFavorites: (userId: UserId) => [...oralStudyKeys.account(userId), 'oralFavorites'] as const,
  oralQuestions: (userId: UserId) => [...oralStudyKeys.account(userId), 'oralQuestions'] as const,
  oralProgress: (userId: UserId, pathId: QualificationPathId) =>
    [...oralStudyKeys.path(userId, pathId), 'oralProgress'] as const,
  oralSession: (userId: UserId, pathId: QualificationPathId, id: OralStudySessionId) =>
    [...oralStudyKeys.path(userId, pathId), 'oralSession', id] as const,
  getOralDailyPlan: (userId: UserId, req: GetOralDailyPlanRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralDailyPlan',
      req,
    ] as const,
  getOralReviewPreview: (userId: UserId, req: GetOralReviewPreviewRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralReviewPreview',
      req,
    ] as const,
  getOralReviewSession: (userId: UserId, req: GetOralReviewSessionRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralReviewSession',
      req,
    ] as const,
  getOralFavoritesPreview: (userId: UserId, req: GetOralFavoritesPreviewRequest) =>
    [...oralStudyKeys.oralFavorites(userId), 'getOralFavoritesPreview', req] as const,
  getOralFavoritesSession: (userId: UserId, req: GetOralFavoritesSessionRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralFavoritesSession',
      req,
    ] as const,
  getOralMaterials: (userId: UserId, req: GetOralMaterialsRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralMaterials',
      req,
    ] as const,
  getOralSessionPreview: (userId: UserId, req: GetOralSessionPreviewRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralSessionPreview',
      req,
    ] as const,
  getLatestOralSession: (userId: UserId, req: GetLatestOralSessionRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getLatestOralSession',
      req,
    ] as const,
  getOralSessionNextStep: (userId: UserId, req: GetOralSessionNextStepRequest) =>
    [
      ...oralStudyKeys.oralProgress(userId, req.params.qualificationPathId),
      'getOralSessionNextStep',
      req,
    ] as const,
  getOralSession: (userId: UserId, req: GetOralSessionRequest) =>
    [
      ...oralStudyKeys.oralSession(userId, req.params.qualificationPathId, req.params.sessionId),
      'getOralSession',
      req,
    ] as const,
  getOralSessionSummary: (userId: UserId, req: GetOralSessionSummaryRequest) =>
    [
      ...oralStudyKeys.oralSession(userId, req.params.qualificationPathId, req.params.sessionId),
      'getOralSessionSummary',
      req,
    ] as const,
  getOralSessionResultsInfinite: (userId: UserId, req: GetOralSessionResultsRequest) =>
    [
      ...oralStudyKeys.oralSession(userId, req.params.qualificationPathId, req.params.sessionId),
      'getOralSessionResultsInfinite',
      req,
    ] as const,
  getOralSessionQuestion: (userId: UserId, req: GetOralSessionQuestionRequest) =>
    [...oralStudyKeys.oralQuestions(userId), 'getOralSessionQuestion', req] as const,
  getOralQuestionDetails: (userId: UserId, req: GetOralQuestionDetailsRequest) =>
    [...oralStudyKeys.oralQuestions(userId), 'getOralQuestionDetails', req] as const,
  getOralSessionQuiz: (userId: UserId, req: GetOralSessionQuizRequest) =>
    [
      ...oralStudyKeys.oralSession(userId, req.params.qualificationPathId, req.params.sessionId),
      'getOralSessionQuiz',
      req,
    ] as const,
  getOralQuizChecksInfinite: (userId: UserId, req: GetOralQuizChecksRequest) =>
    [
      ...oralStudyKeys.oralSession(userId, req.params.qualificationPathId, req.params.sessionId),
      'getOralQuizChecksInfinite',
      req,
    ] as const,
}
