import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  getDocumentPdfDownload,
  type GetDocumentPdfDownloadRequest,
} from '@inzpro/api-client/modules/learning-content'
import { apiHttpClient } from '~platform/lib/api-client'

export const getPdfDownloadUrl = (req: GetDocumentPdfDownloadRequest) =>
  runApi(getDocumentPdfDownload(req), apiHttpClient)
