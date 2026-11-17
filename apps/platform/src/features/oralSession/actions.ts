import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  endOralSession,
  type EndOralSessionRequest,
  startOralSession,
  type StartOralSessionRequest,
  submitOralSelfAssessment,
  type SubmitOralSelfAssessmentRequest,
} from '@inzpro/api-client/modules/oral-study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startOralStudySession = (req: StartOralSessionRequest) =>
  runApi(startOralSession(req), apiHttpClient)

export const submitOralStudySelfAssessment = (req: SubmitOralSelfAssessmentRequest) =>
  runApi(submitOralSelfAssessment(req), apiHttpClient)

export const endOralStudySession = (req: EndOralSessionRequest) =>
  runApi(endOralSession(req), apiHttpClient)
