import type {
  GetPathsRequest,
  GetPathRequest,
  GetGoalOptionsRequest,
  GetGoalHistoryRequest,
} from '@inzpro/api-client/modules/preparation'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

export const preparationKeys = {
  all: ['preparation'] as const,
  paths: (userId: UserId) => [...preparationKeys.all, 'paths', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...preparationKeys.all, 'path', userId, id] as const,
  getPaths: (userId: UserId, req: GetPathsRequest) =>
    [...preparationKeys.paths(userId), 'getPaths', req] as const,
  getPathsInfinite: (userId: UserId, req: GetPathsRequest) =>
    [...preparationKeys.paths(userId), 'infinite', 'getPaths', req] as const,
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
