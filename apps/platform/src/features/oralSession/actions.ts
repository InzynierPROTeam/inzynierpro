import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  endOralSession,
  type EndOralSessionRequest,
  startOralSession,
  type StartOralSessionRequest,
  submitOralSelfAssessment,
  type SubmitOralSelfAssessmentRequest,
  startOralFavoritesSession,
  type StartOralFavoritesSessionRequest,
  markOralFavoriteQuestion,
  type MarkOralFavoriteQuestionRequest,
  unmarkOralFavoriteQuestion,
  type UnmarkOralFavoriteQuestionRequest,
  clearOralQuestionNote,
  type ClearOralQuestionNoteRequest,
  saveOralQuestionNote,
  type SaveOralQuestionNoteRequest,
} from '@inzpro/api-client/modules/study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startOralStudySession = (req: StartOralSessionRequest) =>
  runApi(startOralSession(req), apiHttpClient)

export const submitOralStudySelfAssessment = (req: SubmitOralSelfAssessmentRequest) =>
  runApi(submitOralSelfAssessment(req), apiHttpClient)

export const endOralStudySession = (req: EndOralSessionRequest) =>
  runApi(endOralSession(req), apiHttpClient)

export const startStudyOralFavoritesSession = (req: StartOralFavoritesSessionRequest) =>
  runApi(startOralFavoritesSession(req), apiHttpClient)

export const markOralFavorite = (req: MarkOralFavoriteQuestionRequest) =>
  runApi(markOralFavoriteQuestion(req), apiHttpClient)

export const unmarkOralFavorite = (req: UnmarkOralFavoriteQuestionRequest) =>
  runApi(unmarkOralFavoriteQuestion(req), apiHttpClient)

export const saveOralNote = (req: SaveOralQuestionNoteRequest) =>
  runApi(saveOralQuestionNote(req), apiHttpClient)

export const clearOralNote = (req: ClearOralQuestionNoteRequest) =>
  runApi(clearOralQuestionNote(req), apiHttpClient)
