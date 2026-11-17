import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  startOralSessionQuiz,
  type StartOralSessionQuizRequest,
  answerOralQuizCheck,
  type AnswerOralQuizCheckRequest,
} from '@inzpro/api-client/modules/oral-study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startOralQuiz = (req: StartOralSessionQuizRequest) =>
  runApi(startOralSessionQuiz(req), apiHttpClient)

export const checkOralQuizAnswer = (req: AnswerOralQuizCheckRequest) =>
  runApi(answerOralQuizCheck(req), apiHttpClient)
