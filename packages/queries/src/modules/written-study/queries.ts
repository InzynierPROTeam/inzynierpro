import {
  getDocuments,
  getDocument,
  type GetDocumentRequest,
  type GetDocumentsRequest,
  getSessionPreview,
  type GetSessionPreviewRequest,
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
} from '@inzpro/api-client/modules/written-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

import { writtenStudyKeys } from './keys.js'

export const documentsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetDocumentsRequest,
) =>
  effectInfiniteQueryOptions(
    writtenStudyKeys.getDocuments(userId, req),
    cursor => getDocuments({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const sessionPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionPreviewRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getSessionPreview(userId, req),
    getSessionPreview(req),
    httpClient,
  )

export const documentQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetDocumentRequest,
) => effectQueryOptions(writtenStudyKeys.getDocument(userId, req), getDocument(req), httpClient)

export const latestSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetLatestSessionRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getLatestSession(userId, req),
    getLatestSession(req),
    httpClient,
  )

export const reviewPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetReviewPreviewRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getReviewPreview(userId, req),
    getReviewPreview(req),
    httpClient,
  )

export const reviewSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetReviewSessionRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getReviewSession(userId, req),
    getReviewSession(req),
    httpClient,
  )

export const favoritesPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetFavoritesPreviewRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getFavoritesPreview(userId, req),
    getFavoritesPreview(req),
    httpClient,
  )

export const favoritesSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetFavoritesSessionRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getFavoritesSession(userId, req),
    getFavoritesSession(req),
    httpClient,
  )

export const sessionNextStepQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionNextStepRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getSessionNextStep(userId, req),
    getSessionNextStep(req),
    httpClient,
  )

export const sessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionRequest,
) => effectQueryOptions(writtenStudyKeys.getSession(userId, req), getSession(req), httpClient)

export const sessionQuestionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionQuestionRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getSessionQuestion(userId, req),
    getSessionQuestion(req),
    httpClient,
  )

export const sessionSummaryQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionSummaryRequest,
) =>
  effectQueryOptions(
    writtenStudyKeys.getSessionSummary(userId, req),
    getSessionSummary(req),
    httpClient,
  )

export const sessionResultsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionResultsRequest,
) =>
  effectInfiniteQueryOptions(
    writtenStudyKeys.getSessionResultsInfinite(userId, req),
    cursor => getSessionResults({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )
