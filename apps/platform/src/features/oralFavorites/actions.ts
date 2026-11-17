import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  startOralFavoritesSession,
  type StartOralFavoritesSessionRequest,
  markOralFavoriteQuestion,
  type MarkOralFavoriteQuestionRequest,
  unmarkOralFavoriteQuestion,
  type UnmarkOralFavoriteQuestionRequest,
} from '@inzpro/api-client/modules/oral-study'
import { apiHttpClient } from '~platform/lib/api-client'

export const startStudyOralFavoritesSession = (req: StartOralFavoritesSessionRequest) =>
  runApi(startOralFavoritesSession(req), apiHttpClient)

export const markOralFavorite = (req: MarkOralFavoriteQuestionRequest) =>
  runApi(markOralFavoriteQuestion(req), apiHttpClient)

export const unmarkOralFavorite = (req: UnmarkOralFavoriteQuestionRequest) =>
  runApi(unmarkOralFavoriteQuestion(req), apiHttpClient)
