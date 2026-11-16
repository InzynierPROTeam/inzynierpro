import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  markFavoriteQuestion,
  type MarkFavoriteQuestionRequest,
  startFavoritesSession,
  type StartFavoritesSessionRequest,
  unmarkFavoriteQuestion,
  type UnmarkFavoriteQuestionRequest,
} from '@inzpro/api-client/modules/study'
import { apiHttpClient } from '~platform/lib/api-client'

export const markFavorite = (req: MarkFavoriteQuestionRequest) =>
  runApi(markFavoriteQuestion(req), apiHttpClient)

export const unmarkFavorite = (req: UnmarkFavoriteQuestionRequest) =>
  runApi(unmarkFavoriteQuestion(req), apiHttpClient)

export const startStudyFavoritesSession = (req: StartFavoritesSessionRequest) =>
  runApi(startFavoritesSession(req), apiHttpClient)
