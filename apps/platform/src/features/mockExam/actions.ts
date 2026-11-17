import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  flagAttemptQuestion,
  type FlagAttemptQuestionRequest,
  saveAttemptAnswer,
  type SaveAttemptAnswerRequest,
  startMockExamAttempt,
  type StartMockExamAttemptRequest,
} from '@inzpro/api-client/modules/mock-exams'
import { apiHttpClient } from '~platform/lib/api-client'

export const startAttempt = (req: StartMockExamAttemptRequest) =>
  runApi(startMockExamAttempt(req), apiHttpClient)

export const saveAnswer = (req: SaveAttemptAnswerRequest) =>
  runApi(saveAttemptAnswer(req), apiHttpClient)

export const flagQuestion = (req: FlagAttemptQuestionRequest) =>
  runApi(flagAttemptQuestion(req), apiHttpClient)
