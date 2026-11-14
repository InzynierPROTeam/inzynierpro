import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  recordSessionAssistance,
  type RecordSessionAssistanceRequest,
  startSession,
  type StartSessionRequest,
  submitSessionAnswer,
  type SubmitSessionAnswerRequest,
} from '@inzpro/api-client/modules/study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startStudySession = (req: StartSessionRequest) =>
  runApi(startSession(req), apiHttpClient)

export const recordStudySessionAssistance = (req: RecordSessionAssistanceRequest) =>
  runApi(recordSessionAssistance(req), apiHttpClient)

export const submitStudySessionAnswer = (req: SubmitSessionAnswerRequest) =>
  runApi(submitSessionAnswer(req), apiHttpClient)
