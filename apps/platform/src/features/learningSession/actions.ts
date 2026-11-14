import { runApi } from '@inzpro/api-client/lib/run-api'
import { startSession, type StartSessionRequest } from '@inzpro/api-client/modules/study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startStudySession = (req: StartSessionRequest) =>
  runApi(startSession(req), apiHttpClient)
