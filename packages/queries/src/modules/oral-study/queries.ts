import {
  getOralFavoritesPreview,
  type GetOralFavoritesPreviewRequest,
  getOralFavoritesSession,
  type GetOralFavoritesSessionRequest,
  getOralDailyPlan,
  type GetOralDailyPlanRequest,
  getOralReviewPreview,
  type GetOralReviewPreviewRequest,
  getOralReviewSession,
  type GetOralReviewSessionRequest,
  getOralMaterials,
  type GetOralMaterialsRequest,
  getOralSessionPreview,
  type GetOralSessionPreviewRequest,
  getLatestOralSession,
  type GetLatestOralSessionRequest,
  getOralSession,
  type GetOralSessionRequest,
  getOralSessionNextStep,
  type GetOralSessionNextStepRequest,
  getOralSessionSummary,
  type GetOralSessionSummaryRequest,
  getOralSessionResults,
  type GetOralSessionResultsRequest,
  getOralSessionQuestion,
  getOralQuestionDetails,
  type GetOralQuestionDetailsRequest,
  type GetOralSessionQuestionRequest,
  getOralSessionQuiz,
  type GetOralSessionQuizRequest,
  getOralQuizChecks,
  type GetOralQuizChecksRequest,
} from '@inzpro/api-client/modules/oral-study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

import { oralStudyKeys } from './keys.js'

export const oralMaterialsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralMaterialsRequest,
) =>
  effectInfiniteQueryOptions(
    oralStudyKeys.getOralMaterials(userId, req),
    cursor => getOralMaterials({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const oralSessionPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionPreviewRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralSessionPreview(userId, req),
    getOralSessionPreview(req),
    httpClient,
  )

export const latestOralSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetLatestOralSessionRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getLatestOralSession(userId, req),
    getLatestOralSession(req),
    httpClient,
  )

export const oralSessionNextStepQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionNextStepRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralSessionNextStep(userId, req),
    getOralSessionNextStep(req),
    httpClient,
  )

export const oralSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionRequest,
) => effectQueryOptions(oralStudyKeys.getOralSession(userId, req), getOralSession(req), httpClient)

export const oralSessionQuestionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionQuestionRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralSessionQuestion(userId, req),
    getOralSessionQuestion(req),
    httpClient,
  )

export const oralSessionSummaryQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionSummaryRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralSessionSummary(userId, req),
    getOralSessionSummary(req),
    httpClient,
  )

export const oralSessionResultsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionResultsRequest,
) =>
  effectInfiniteQueryOptions(
    oralStudyKeys.getOralSessionResultsInfinite(userId, req),
    cursor => getOralSessionResults({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const oralDailyPlanQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralDailyPlanRequest,
) =>
  effectQueryOptions(oralStudyKeys.getOralDailyPlan(userId, req), getOralDailyPlan(req), httpClient)

export const oralReviewPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralReviewPreviewRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralReviewPreview(userId, req),
    getOralReviewPreview(req),
    httpClient,
  )

export const oralReviewSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralReviewSessionRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralReviewSession(userId, req),
    getOralReviewSession(req),
    httpClient,
  )

export const oralFavoritesPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralFavoritesPreviewRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralFavoritesPreview(userId, req),
    getOralFavoritesPreview(req),
    httpClient,
  )

export const oralFavoritesSessionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralFavoritesSessionRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralFavoritesSession(userId, req),
    getOralFavoritesSession(req),
    httpClient,
  )

export const oralSessionQuizQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralSessionQuizRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralSessionQuiz(userId, req),
    getOralSessionQuiz(req),
    httpClient,
  )

export const oralQuizChecksInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralQuizChecksRequest,
) =>
  effectInfiniteQueryOptions(
    oralStudyKeys.getOralQuizChecksInfinite(userId, req),
    cursor => getOralQuizChecks({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const oralQuestionDetailsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralQuestionDetailsRequest,
) =>
  effectQueryOptions(
    oralStudyKeys.getOralQuestionDetails(userId, req),
    getOralQuestionDetails(req),
    httpClient,
  )
