import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  archivePath,
  restorePath,
  extendPath,
  selectPath,
  type ArchivePathRequest,
  type RestorePathRequest,
  type ExtendPathRequest,
  type SelectPathRequest,
} from '@inzpro/api-client/modules/preparation'
import { apiHttpClient } from '~platform/lib/api-client'

export const selectQualificationPath = (req: SelectPathRequest) =>
  runApi(selectPath(req), apiHttpClient)

export const archiveQualificationPath = (req: ArchivePathRequest) =>
  runApi(archivePath(req), apiHttpClient)

export const restoreQualificationPath = (req: RestorePathRequest) =>
  runApi(restorePath(req), apiHttpClient)

export const extendQualificationPath = (req: ExtendPathRequest) =>
  runApi(extendPath(req), apiHttpClient)
