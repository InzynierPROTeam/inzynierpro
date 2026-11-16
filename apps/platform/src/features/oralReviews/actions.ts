import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  startOralReviewSession,
  type StartOralReviewSessionRequest,
} from '@inzpro/api-client/modules/study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startStudyOralReviewSession = (req: StartOralReviewSessionRequest) =>
  runApi(startOralReviewSession(req), apiHttpClient)
