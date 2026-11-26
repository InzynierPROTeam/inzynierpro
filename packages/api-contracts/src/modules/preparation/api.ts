import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Authentication } from '~api-contracts/middleware/authentication/api.js'
import {
  PathAccessDenied,
  PathLimitReached,
  InvalidPathConfiguration,
  GoalConflict,
} from '~api-contracts/modules/preparation/errors.js'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import {
  ChangeGoalPayload,
  CompleteOnboardingPayload,
  GoalHistoryQuery,
  GoalOptionsQuery,
  PathParams,
  PathsQuery,
  SetDistrictChamberPayload,
} from './requests.js'
import { MyChamberResponse } from './responses.js'
import {
  GoalHistoryResponse,
  GoalOptionsResponse,
  PathMutationResponse,
  PathResponse,
  QualificationPathsResponse,
} from './responses.js'

export const GetPathsEndpoint = HttpApiEndpoint.get('GetPaths', '/paths', {
  query: PathsQuery,
  success: QualificationPathsResponse,
  error: [InternalServerError, RateLimitExceeded, InvalidRequest],
})

export const GetPathEndpoint = HttpApiEndpoint.get('GetPath', '/paths/:qualificationPathId', {
  params: PathParams,
  success: PathResponse,
  error: [InternalServerError, RateLimitExceeded],
})

export const CompleteOnboardingEndpoint = HttpApiEndpoint.post(
  'CompleteOnboarding',
  '/onboarding',
  {
    payload: CompleteOnboardingPayload,
    success: PathMutationResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidPathConfiguration, PathLimitReached],
  },
)

export const ArchivePathEndpoint = HttpApiEndpoint.post(
  'ArchivePath',
  '/paths/:qualificationPathId/archive',
  {
    params: PathParams,
    success: PathMutationResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const RestorePathEndpoint = HttpApiEndpoint.post(
  'RestorePath',
  '/paths/:qualificationPathId/restore',
  {
    params: PathParams,
    success: PathMutationResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const ExtendPathEndpoint = HttpApiEndpoint.post(
  'ExtendPath',
  '/paths/:qualificationPathId/extend',
  {
    params: PathParams,
    success: PathMutationResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const ChangeGoalEndpoint = HttpApiEndpoint.post(
  'ChangeGoal',
  '/paths/:qualificationPathId/goal',
  {
    params: PathParams,
    payload: ChangeGoalPayload,
    success: PathMutationResponse,
    error: [
      InternalServerError,
      RateLimitExceeded,
      PathAccessDenied,
      InvalidPathConfiguration,
      GoalConflict,
    ],
  },
)

export const SetDistrictChamberEndpoint = HttpApiEndpoint.post(
  'SetDistrictChamber',
  '/paths/:qualificationPathId/district-chamber',
  {
    params: PathParams,
    payload: SetDistrictChamberPayload,
    success: PathMutationResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied, InvalidPathConfiguration],
  },
)

export const GetGoalHistoryEndpoint = HttpApiEndpoint.get(
  'GetGoalHistory',
  '/paths/:qualificationPathId/goals',
  {
    params: PathParams,
    query: GoalHistoryQuery,
    success: GoalHistoryResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, PathAccessDenied],
  },
)

export const GetGoalOptionsEndpoint = HttpApiEndpoint.get(
  'GetGoalOptions',
  '/paths/:qualificationPathId/goal-options',
  {
    params: PathParams,
    query: GoalOptionsQuery,
    success: GoalOptionsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest, PathAccessDenied],
  },
)

export const GetMyChamberEndpoint = HttpApiEndpoint.get(
  'GetMyChamber',
  '/paths/:qualificationPathId/chamber',
  {
    params: PathParams,
    success: MyChamberResponse,
    error: [InternalServerError, RateLimitExceeded, PathAccessDenied],
  },
)

export const PreparationApi = HttpApiGroup.make('Preparation')
  .add(GetMyChamberEndpoint)
  .add(GetPathsEndpoint)
  .add(GetPathEndpoint)
  .add(CompleteOnboardingEndpoint)
  .add(ArchivePathEndpoint)
  .add(RestorePathEndpoint)
  .add(ExtendPathEndpoint)
  .add(ChangeGoalEndpoint)
  .add(SetDistrictChamberEndpoint)
  .add(GetGoalHistoryEndpoint)
  .add(GetGoalOptionsEndpoint)
  .middleware(Authentication)
  .prefix('/preparation')
