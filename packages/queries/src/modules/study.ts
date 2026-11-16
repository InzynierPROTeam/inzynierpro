import {
  getDocuments,
  getDocument,
  type GetDocumentRequest,
  type GetDocumentsRequest,
  getSessionPreview,
  type GetSessionPreviewRequest,
  getOralMaterials,
  type GetOralMaterialsRequest,
  getLatestSession,
  type GetLatestSessionRequest,
  getReviewPreview,
  type GetReviewPreviewRequest,
  getReviewSession,
  type GetReviewSessionRequest,
  getFavoritesPreview,
  type GetFavoritesPreviewRequest,
  getFavoritesSession,
  type GetFavoritesSessionRequest,
  getSession,
  type GetSessionRequest,
  getSessionQuestion,
  type GetSessionQuestionRequest,
  getSessionSummary,
  type GetSessionSummaryRequest,
  getSessionNextStep,
  type GetSessionNextStepRequest,
  getSessionResults,
  type GetSessionResultsRequest,
} from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { StudySessionId } from '@inzpro/domain/modules/study/study-session'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

export const studyKeys = {
  all: ['study'] as const,
  account: (userId: UserId) => [...studyKeys.all, 'account', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...studyKeys.account(userId), 'path', id] as const,
  // Reads that show the learner's progress on the path, which every answer changes.
  progress: (userId: UserId, pathId: QualificationPathId) =>
    [...studyKeys.path(userId, pathId), 'progress'] as const,
  getDocuments: (userId: UserId, req: GetDocumentsRequest) =>
    [...studyKeys.progress(userId, req.params.qualificationPathId), 'getDocuments', req] as const,
  getDocument: (userId: UserId, req: GetDocumentRequest) =>
    [...studyKeys.progress(userId, req.params.qualificationPathId), 'getDocument', req] as const,
  getSessionPreview: (userId: UserId, req: GetSessionPreviewRequest) =>
    [
      ...studyKeys.progress(userId, req.params.qualificationPathId),
      'getSessionPreview',
      req,
    ] as const,
  getOralMaterials: (userId: UserId, req: GetOralMaterialsRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getOralMaterials', req] as const,
  getLatestSession: (userId: UserId, req: GetLatestSessionRequest) =>
    [
      ...studyKeys.progress(userId, req.params.qualificationPathId),
      'getLatestSession',
      req,
    ] as const,
  // Review reads sit in the progress group, because every answer can make a question due or not.
  getReviewPreview: (userId: UserId, req: GetReviewPreviewRequest) =>
    [
      ...studyKeys.progress(userId, req.params.qualificationPathId),
      'getReviewPreview',
      req,
    ] as const,
  getReviewSession: (userId: UserId, req: GetReviewSessionRequest) =>
    [
      ...studyKeys.progress(userId, req.params.qualificationPathId),
      'getReviewSession',
      req,
    ] as const,
  getFavoritesSession: (userId: UserId, req: GetFavoritesSessionRequest) =>
    [
      ...studyKeys.progress(userId, req.params.qualificationPathId),
      'getFavoritesSession',
      req,
    ] as const,
  // Marks span all paths, so their previews invalidate independently of path progress.
  favorites: (userId: UserId) => [...studyKeys.account(userId), 'favorites'] as const,
  // Marks and notes span all paths and invalidate every session question.
  questions: (userId: UserId) => [...studyKeys.account(userId), 'questions'] as const,
  getFavoritesPreview: (userId: UserId, req: GetFavoritesPreviewRequest) =>
    [...studyKeys.favorites(userId), 'getFavoritesPreview', req] as const,
  // The step after a session depends on the whole path's progress, not on the session alone.
  getSessionNextStep: (userId: UserId, req: GetSessionNextStepRequest) =>
    [
      ...studyKeys.progress(userId, req.params.qualificationPathId),
      'getSessionNextStep',
      req,
    ] as const,
  session: (userId: UserId, pathId: QualificationPathId, id: StudySessionId) =>
    [...studyKeys.path(userId, pathId), 'session', id] as const,
  getSession: (userId: UserId, req: GetSessionRequest) =>
    [
      ...studyKeys.session(userId, req.params.qualificationPathId, req.params.sessionId),
      'getSession',
      req,
    ] as const,
  getSessionSummary: (userId: UserId, req: GetSessionSummaryRequest) =>
    [
      ...studyKeys.session(userId, req.params.qualificationPathId, req.params.sessionId),
      'getSessionSummary',
      req,
    ] as const,
  getSessionResultsInfinite: (userId: UserId, req: GetSessionResultsRequest) =>
    [
      ...studyKeys.session(userId, req.params.qualificationPathId, req.params.sessionId),
      'getSessionResultsInfinite',
      req,
    ] as const,
  // Outside session keys so account-wide mark/note invalidation reaches it; answers update it directly.
  getSessionQuestion: (userId: UserId, req: GetSessionQuestionRequest) =>
    [...studyKeys.questions(userId), 'getSessionQuestion', req] as const,
}

export const documentsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetDocumentsRequest,
) =>
  effectInfiniteQueryOptions(
    studyKeys.getDocuments(userId, req),
    cursor => getDocuments({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const sessionPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionPreviewRequest,
) =>
  effectQueryOptions(studyKeys.getSessionPreview(userId, req), getSessionPreview(req), httpClient)

export const oralMaterialsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralMaterialsRequest,
) =>
  effectInfiniteQueryOptions(
    studyKeys.getOralMaterials(userId, req),
    cursor => getOralMaterials({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const documentQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetDocumentRequest,
) => effectQueryOptions(studyKeys.getDocument(userId, req), getDocument(req), httpClient)

export const latestSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetLatestSessionRequest,
) => effectQueryOptions(studyKeys.getLatestSession(userId, req), getLatestSession(req), httpClient)

export const reviewPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetReviewPreviewRequest,
) => effectQueryOptions(studyKeys.getReviewPreview(userId, req), getReviewPreview(req), httpClient)

export const reviewSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetReviewSessionRequest,
) => effectQueryOptions(studyKeys.getReviewSession(userId, req), getReviewSession(req), httpClient)

export const favoritesPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetFavoritesPreviewRequest,
) =>
  effectQueryOptions(
    studyKeys.getFavoritesPreview(userId, req),
    getFavoritesPreview(req),
    httpClient,
  )

export const favoritesSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetFavoritesSessionRequest,
) =>
  effectQueryOptions(
    studyKeys.getFavoritesSession(userId, req),
    getFavoritesSession(req),
    httpClient,
  )

export const sessionNextStepQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionNextStepRequest,
) =>
  effectQueryOptions(studyKeys.getSessionNextStep(userId, req), getSessionNextStep(req), httpClient)

export const sessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionRequest,
) => effectQueryOptions(studyKeys.getSession(userId, req), getSession(req), httpClient)

export const sessionQuestionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionQuestionRequest,
) =>
  effectQueryOptions(studyKeys.getSessionQuestion(userId, req), getSessionQuestion(req), httpClient)

export const sessionSummaryQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionSummaryRequest,
) =>
  effectQueryOptions(studyKeys.getSessionSummary(userId, req), getSessionSummary(req), httpClient)

export const sessionResultsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionResultsRequest,
) =>
  effectInfiniteQueryOptions(
    studyKeys.getSessionResultsInfinite(userId, req),
    cursor => getSessionResults({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )
