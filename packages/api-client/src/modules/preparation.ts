import type {
  GetPathsEndpoint,
  GetSelectedPathEndpoint,
  GetPathEndpoint,
  SelectPathEndpoint,
  CompleteOnboardingEndpoint,
  ArchivePathEndpoint,
  RestorePathEndpoint,
  ExtendPathEndpoint,
  ChangeGoalEndpoint,
  GetGoalHistoryEndpoint,
  GetGoalOptionsEndpoint,
} from '@inzpro/api-contracts/modules/preparation/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getPaths = (req: GetPathsRequest) => apiAction(api => api.Preparation.GetPaths(req))

export type GetPathsRequest = InferEndpointRequest<typeof GetPathsEndpoint>

export type GetPathsRes = Effect.Success<ReturnType<typeof getPaths>>

export type GetPathsError = Effect.Error<ReturnType<typeof getPaths>>

export const getSelectedPath = (req: GetSelectedPathRequest = {}) =>
  apiAction(api => api.Preparation.GetSelectedPath(req))

export type GetSelectedPathRequest = InferEndpointRequest<typeof GetSelectedPathEndpoint>

export type GetSelectedPathRes = Effect.Success<ReturnType<typeof getSelectedPath>>

export type GetSelectedPathError = Effect.Error<ReturnType<typeof getSelectedPath>>

export const getPath = (req: GetPathRequest) => apiAction(api => api.Preparation.GetPath(req))

export type GetPathRequest = InferEndpointRequest<typeof GetPathEndpoint>

export type GetPathRes = Effect.Success<ReturnType<typeof getPath>>

export type GetPathError = Effect.Error<ReturnType<typeof getPath>>

export const selectPath = (req: SelectPathRequest) =>
  apiAction(api => api.Preparation.SelectPath(req))

export type SelectPathRequest = InferEndpointRequest<typeof SelectPathEndpoint>

export type SelectPathRes = Effect.Success<ReturnType<typeof selectPath>>

export type SelectPathError = Effect.Error<ReturnType<typeof selectPath>>

export const completeOnboarding = (req: CompleteOnboardingRequest) =>
  apiAction(api => api.Preparation.CompleteOnboarding(req))

export type CompleteOnboardingRequest = InferEndpointRequest<typeof CompleteOnboardingEndpoint>

export type CompleteOnboardingRes = Effect.Success<ReturnType<typeof completeOnboarding>>

export type CompleteOnboardingError = Effect.Error<ReturnType<typeof completeOnboarding>>

export const archivePath = (req: ArchivePathRequest) =>
  apiAction(api => api.Preparation.ArchivePath(req))

export type ArchivePathRequest = InferEndpointRequest<typeof ArchivePathEndpoint>

export type ArchivePathRes = Effect.Success<ReturnType<typeof archivePath>>

export type ArchivePathError = Effect.Error<ReturnType<typeof archivePath>>

export const restorePath = (req: RestorePathRequest) =>
  apiAction(api => api.Preparation.RestorePath(req))

export type RestorePathRequest = InferEndpointRequest<typeof RestorePathEndpoint>

export type RestorePathRes = Effect.Success<ReturnType<typeof restorePath>>

export type RestorePathError = Effect.Error<ReturnType<typeof restorePath>>

export const extendPath = (req: ExtendPathRequest) =>
  apiAction(api => api.Preparation.ExtendPath(req))

export type ExtendPathRequest = InferEndpointRequest<typeof ExtendPathEndpoint>

export type ExtendPathRes = Effect.Success<ReturnType<typeof extendPath>>

export type ExtendPathError = Effect.Error<ReturnType<typeof extendPath>>

export const changeGoal = (req: ChangeGoalRequest) =>
  apiAction(api => api.Preparation.ChangeGoal(req))

export type ChangeGoalRequest = InferEndpointRequest<typeof ChangeGoalEndpoint>

export type ChangeGoalRes = Effect.Success<ReturnType<typeof changeGoal>>

export type ChangeGoalError = Effect.Error<ReturnType<typeof changeGoal>>

export const getGoalHistory = (req: GetGoalHistoryRequest) =>
  apiAction(api => api.Preparation.GetGoalHistory(req))

export type GetGoalHistoryRequest = InferEndpointRequest<typeof GetGoalHistoryEndpoint>

export type GetGoalHistoryRes = Effect.Success<ReturnType<typeof getGoalHistory>>

export type GetGoalHistoryError = Effect.Error<ReturnType<typeof getGoalHistory>>

export const getGoalOptions = (req: GetGoalOptionsRequest) =>
  apiAction(api => api.Preparation.GetGoalOptions(req))

export type GetGoalOptionsRequest = InferEndpointRequest<typeof GetGoalOptionsEndpoint>

export type GetGoalOptionsRes = Effect.Success<ReturnType<typeof getGoalOptions>>

export type GetGoalOptionsError = Effect.Error<ReturnType<typeof getGoalOptions>>
