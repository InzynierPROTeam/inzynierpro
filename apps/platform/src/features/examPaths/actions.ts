import { runApi } from '@inzpro/api-client/lib/run-api'
import { resetPath, type ResetPathRequest } from '@inzpro/api-client/modules/path-reset'
import {
  archivePath,
  restorePath,
  extendPath,
  type ArchivePathRequest,
  type RestorePathRequest,
  type ExtendPathRequest,
} from '@inzpro/api-client/modules/preparation'
import { apiHttpClient } from '~platform/lib/api-client'

export const archiveQualificationPath = (req: ArchivePathRequest) =>
  runApi(archivePath(req), apiHttpClient)

export const restoreQualificationPath = (req: RestorePathRequest) =>
  runApi(restorePath(req), apiHttpClient)

export const extendQualificationPath = (req: ExtendPathRequest) =>
  runApi(extendPath(req), apiHttpClient)

export const resetQualificationPath = (req: ResetPathRequest) =>
  runApi(resetPath(req), apiHttpClient)
