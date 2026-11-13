import { runApi } from '@inzpro/api-client/lib/run-api'
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
