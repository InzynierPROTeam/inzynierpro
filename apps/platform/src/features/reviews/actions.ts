import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  startReviewSession,
  type StartReviewSessionRequest,
} from '@inzpro/api-client/modules/study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startStudyReviewSession = (req: StartReviewSessionRequest) =>
  runApi(startReviewSession(req), apiHttpClient)
