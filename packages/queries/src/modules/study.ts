import {
  getDocuments,
  type GetDocumentsRequest,
  getSessionPreview,
  type GetSessionPreviewRequest,
  getOralMaterials,
  type GetOralMaterialsRequest,
} from '@inzpro/api-client/modules/study'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

export const studyKeys = {
  all: ['study'] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...studyKeys.all, 'path', userId, id] as const,
  getDocuments: (userId: UserId, req: GetDocumentsRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getDocuments', req] as const,
  getSessionPreview: (userId: UserId, req: GetSessionPreviewRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getSessionPreview', req] as const,
  getOralMaterials: (userId: UserId, req: GetOralMaterialsRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getOralMaterials', req] as const,
}

export const documentsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetDocumentsRequest,
) =>
  effectInfiniteQueryOptions(
    studyKeys.getDocuments(userId, req),
    cursor => getDocuments({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const sessionPreviewQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSessionPreviewRequest,
) =>
  effectQueryOptions(studyKeys.getSessionPreview(userId, req), getSessionPreview(req), httpClient)

export const oralMaterialsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetOralMaterialsRequest,
) =>
  effectInfiniteQueryOptions(
    studyKeys.getOralMaterials(userId, req),
    cursor => getOralMaterials({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )
