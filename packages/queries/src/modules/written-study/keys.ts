import type {
  GetDocumentRequest,
  GetDocumentsRequest,
  GetSessionPreviewRequest,
  GetLatestSessionRequest,
  GetDailyPlanRequest,
  GetReviewPreviewRequest,
  GetReviewSessionRequest,
  GetFavoritesPreviewRequest,
  GetFavoritesSessionRequest,
  GetSessionRequest,
  GetSessionQuestionRequest,
  GetSessionSummaryRequest,
  GetSessionNextStepRequest,
  GetSessionResultsRequest,
} from '@inzpro/api-client/modules/written-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

export const writtenStudyKeys = {
  all: ['written-study'] as const,
  account: (userId: UserId) => [...writtenStudyKeys.all, 'account', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...writtenStudyKeys.account(userId), 'path', id] as const,
  favorites: (userId: UserId) => [...writtenStudyKeys.account(userId), 'favorites'] as const,
  questions: (userId: UserId) => [...writtenStudyKeys.account(userId), 'questions'] as const,
  progress: (userId: UserId, pathId: QualificationPathId) =>
    [...writtenStudyKeys.path(userId, pathId), 'progress'] as const,
  session: (userId: UserId, pathId: QualificationPathId, id: StudySessionId) =>
    [...writtenStudyKeys.path(userId, pathId), 'session', id] as const,
  getDocuments: (userId: UserId, req: GetDocumentsRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getDocuments',
      req,
    ] as const,
  getDocument: (userId: UserId, req: GetDocumentRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getDocument',
      req,
    ] as const,
  getSessionPreview: (userId: UserId, req: GetSessionPreviewRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getSessionPreview',
      req,
    ] as const,
  getLatestSession: (userId: UserId, req: GetLatestSessionRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getLatestSession',
      req,
    ] as const,
  getDailyPlan: (userId: UserId, req: GetDailyPlanRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getDailyPlan',
      req,
    ] as const,
  getReviewPreview: (userId: UserId, req: GetReviewPreviewRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getReviewPreview',
      req,
    ] as const,
  getReviewSession: (userId: UserId, req: GetReviewSessionRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getReviewSession',
      req,
    ] as const,
  getFavoritesSession: (userId: UserId, req: GetFavoritesSessionRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getFavoritesSession',
      req,
    ] as const,
  getFavoritesPreview: (userId: UserId, req: GetFavoritesPreviewRequest) =>
    [...writtenStudyKeys.favorites(userId), 'getFavoritesPreview', req] as const,
  getSessionNextStep: (userId: UserId, req: GetSessionNextStepRequest) =>
    [
      ...writtenStudyKeys.progress(userId, req.params.qualificationPathId),
      'getSessionNextStep',
      req,
    ] as const,
  getSession: (userId: UserId, req: GetSessionRequest) =>
    [
      ...writtenStudyKeys.session(userId, req.params.qualificationPathId, req.params.sessionId),
      'getSession',
      req,
    ] as const,
  getSessionSummary: (userId: UserId, req: GetSessionSummaryRequest) =>
    [
      ...writtenStudyKeys.session(userId, req.params.qualificationPathId, req.params.sessionId),
      'getSessionSummary',
      req,
    ] as const,
  getSessionResultsInfinite: (userId: UserId, req: GetSessionResultsRequest) =>
    [
      ...writtenStudyKeys.session(userId, req.params.qualificationPathId, req.params.sessionId),
      'getSessionResultsInfinite',
      req,
    ] as const,
  getSessionQuestion: (userId: UserId, req: GetSessionQuestionRequest) =>
    [...writtenStudyKeys.questions(userId), 'getSessionQuestion', req] as const,
}
