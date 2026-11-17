import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  clearOralQuestionNote,
  type ClearOralQuestionNoteRequest,
  saveOralQuestionNote,
  type SaveOralQuestionNoteRequest,
} from '@inzpro/api-client/modules/oral-study'
import { apiHttpClient } from '~platform/lib/api-client'

export const saveOralNote = (req: SaveOralQuestionNoteRequest) =>
  runApi(saveOralQuestionNote(req), apiHttpClient)

export const clearOralNote = (req: ClearOralQuestionNoteRequest) =>
  runApi(clearOralQuestionNote(req), apiHttpClient)
