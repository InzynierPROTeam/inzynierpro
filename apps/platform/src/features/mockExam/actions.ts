import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  startMockExamAttempt,
  type StartMockExamAttemptRequest,
} from '@inzpro/api-client/modules/mock-exams'
import { apiHttpClient } from '~platform/lib/api-client'

export const startAttempt = (req: StartMockExamAttemptRequest) =>
  runApi(startMockExamAttempt(req), apiHttpClient)
