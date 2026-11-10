import {
  getPaths,
  type GetPathsRequest,
  getSelectedPath,
  type GetSelectedPathRequest,
  getPath,
  type GetPathRequest,
  getGoalOptions,
  type GetGoalOptionsRequest,
  getGoalHistory,
  type GetGoalHistoryRequest,
} from '@inzpro/api-client/modules/preparation'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

export const preparationKeys = {
  all: ['preparation'] as const,
  paths: (userId: UserId) => [...preparationKeys.all, 'paths', userId] as const,
  selection: (userId: UserId) => [...preparationKeys.all, 'selection', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...preparationKeys.all, 'path', userId, id] as const,
  getPaths: (userId: UserId, req: GetPathsRequest) =>
    [...preparationKeys.paths(userId), 'getPaths', req] as const,
  getSelectedPath: (userId: UserId, req: GetSelectedPathRequest) =>
    [...preparationKeys.selection(userId), 'getSelectedPath', req] as const,
  getPath: (userId: UserId, req: GetPathRequest) =>
    [...preparationKeys.path(userId, req.params.qualificationPathId), 'getPath', req] as const,
  getGoalOptions: (userId: UserId, req: GetGoalOptionsRequest) =>
    [
      ...preparationKeys.path(userId, req.params.qualificationPathId),
      'getGoalOptions',
      req,
    ] as const,
  getGoalHistory: (userId: UserId, req: GetGoalHistoryRequest) =>
    [
      ...preparationKeys.path(userId, req.params.qualificationPathId),
      'getGoalHistory',
      req,
    ] as const,
}

export const pathsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPathsRequest,
) =>
  effectInfiniteQueryOptions(
    preparationKeys.getPaths(userId, req),
    cursor => getPaths({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const selectedPathQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetSelectedPathRequest = {},
) =>
  effectQueryOptions(preparationKeys.getSelectedPath(userId, req), getSelectedPath(req), httpClient)

export const pathQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPathRequest,
) => effectQueryOptions(preparationKeys.getPath(userId, req), getPath(req), httpClient)

export const goalOptionsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetGoalOptionsRequest,
) =>
  effectInfiniteQueryOptions(
    preparationKeys.getGoalOptions(userId, req),
    cursor => getGoalOptions({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const goalHistoryQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetGoalHistoryRequest,
) =>
  effectInfiniteQueryOptions(
    preparationKeys.getGoalHistory(userId, req),
    cursor => getGoalHistory({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )
