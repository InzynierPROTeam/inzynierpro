import {
  getAttemptQuestion,
  type GetAttemptQuestionRequest,
  getMockExamAttempt,
  type GetMockExamAttemptRequest,
  getMockExamPreview,
  type GetMockExamPreviewRequest,
} from '@inzpro/api-client/modules/mock-exams'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import { effectQueryOptions } from '~queries/lib/effect-query-options.js'

import { mockExamKeys } from './keys.js'

export const mockExamPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetMockExamPreviewRequest,
) =>
  effectQueryOptions(
    mockExamKeys.getMockExamPreview(userId, req),
    getMockExamPreview(req),
    httpClient,
  )

export const mockExamAttemptQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetMockExamAttemptRequest,
) =>
  effectQueryOptions(
    mockExamKeys.getMockExamAttempt(userId, req),
    getMockExamAttempt(req),
    httpClient,
  )

export const attemptQuestionQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetAttemptQuestionRequest,
) =>
  effectQueryOptions(
    mockExamKeys.getAttemptQuestion(userId, req),
    getAttemptQuestion(req),
    httpClient,
  )
