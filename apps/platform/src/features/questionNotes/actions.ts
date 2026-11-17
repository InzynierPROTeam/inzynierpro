import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  clearQuestionNote,
  type ClearQuestionNoteRequest,
  saveQuestionNote,
  type SaveQuestionNoteRequest,
} from '@inzpro/api-client/modules/written-study'
import { apiHttpClient } from '~platform/lib/api-client'

export const saveNote = (req: SaveQuestionNoteRequest) =>
  runApi(saveQuestionNote(req), apiHttpClient)

export const clearNote = (req: ClearQuestionNoteRequest) =>
  runApi(clearQuestionNote(req), apiHttpClient)
