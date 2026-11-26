import {
  getMyChamber,
  type GetMyChamberRequest,
  getPaths,
  type GetPathsRequest,
  getPath,
  type GetPathRequest,
  getGoalOptions,
  type GetGoalOptionsRequest,
  getGoalHistory,
  type GetGoalHistoryRequest,
} from '@inzpro/api-client/modules/preparation'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

import { preparationKeys } from './keys.js'

export const pathsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPathsRequest,
) => effectQueryOptions(preparationKeys.getPaths(userId, req), getPaths(req), httpClient)

export const pathsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPathsRequest,
) =>
  effectInfiniteQueryOptions(
    preparationKeys.getPathsInfinite(userId, req),
    cursor => getPaths({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const pathQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetPathRequest,
) => effectQueryOptions(preparationKeys.getPath(userId, req), getPath(req), httpClient)

export const goalOptionsInfiniteQueryOptions = (
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

export const goalHistoryInfiniteQueryOptions = (
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

export const myChamberQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetMyChamberRequest,
) => effectQueryOptions(preparationKeys.getMyChamber(userId, req), getMyChamber(req), httpClient)
