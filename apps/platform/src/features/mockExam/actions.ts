import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  finishMockExamAttempt,
  type FinishMockExamAttemptRequest,
  flagAttemptQuestion,
  type FlagAttemptQuestionRequest,
  pauseMockExamAttempt,
  type PauseMockExamAttemptRequest,
  resumeMockExamAttempt,
  type ResumeMockExamAttemptRequest,
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

export const pauseExam = (req: PauseMockExamAttemptRequest) =>
  runApi(pauseMockExamAttempt(req), apiHttpClient)

export const resumeExam = (req: ResumeMockExamAttemptRequest) =>
  runApi(resumeMockExamAttempt(req), apiHttpClient)

export const finishExam = (req: FinishMockExamAttemptRequest) =>
  runApi(finishMockExamAttempt(req), apiHttpClient)
