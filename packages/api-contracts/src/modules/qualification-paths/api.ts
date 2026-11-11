import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import {
  QualificationKindsQuery,
  QualificationScopesQuery,
  ResolvePathQuery,
  SpecializationsQuery,
} from './requests.js'
import {
  QualificationKindsResponse,
  QualificationScopesResponse,
  ResolvedPathResponse,
  SpecializationsResponse,
} from './responses.js'

export const ListSpecializationsEndpoint = HttpApiEndpoint.get(
  'ListSpecializations',
  '/specializations',
  {
    query: SpecializationsQuery,
    success: SpecializationsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

export const ListQualificationKindsEndpoint = HttpApiEndpoint.get(
  'ListQualificationKinds',
  '/qualification-kinds',
  {
    query: QualificationKindsQuery,
    success: QualificationKindsResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

export const ListQualificationScopesEndpoint = HttpApiEndpoint.get(
  'ListQualificationScopes',
  '/qualification-scopes',
  {
    query: QualificationScopesQuery,
    success: QualificationScopesResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

export const ResolveQualificationPathEndpoint = HttpApiEndpoint.get(
  'ResolveQualificationPath',
  '/resolve',
  {
    query: ResolvePathQuery,
    success: ResolvedPathResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

export const QualificationPathsApi = HttpApiGroup.make('QualificationPaths')
  .add(ListSpecializationsEndpoint)
  .add(ListQualificationKindsEndpoint)
  .add(ListQualificationScopesEndpoint)
  .add(ResolveQualificationPathEndpoint)
  .prefix('/qualification-paths')
