import type {
  ListSpecializationsEndpoint,
  ListQualificationKindsEndpoint,
  ListQualificationScopesEndpoint,
  ResolveQualificationPathEndpoint,
} from '@inzpro/api-contracts/modules/qualification-paths/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const listSpecializations = (req: ListSpecializationsRequest) =>
  apiAction(api => api.QualificationPaths.ListSpecializations(req))

export type ListSpecializationsRequest = InferEndpointRequest<typeof ListSpecializationsEndpoint>

export type ListSpecializationsRes = Effect.Success<ReturnType<typeof listSpecializations>>

export type ListSpecializationsError = Effect.Error<ReturnType<typeof listSpecializations>>

export const listQualificationKinds = (req: ListQualificationKindsRequest) =>
  apiAction(api => api.QualificationPaths.ListQualificationKinds(req))

export type ListQualificationKindsRequest = InferEndpointRequest<
  typeof ListQualificationKindsEndpoint
>

export type ListQualificationKindsRes = Effect.Success<ReturnType<typeof listQualificationKinds>>

export type ListQualificationKindsError = Effect.Error<ReturnType<typeof listQualificationKinds>>

export const listQualificationScopes = (req: ListQualificationScopesRequest) =>
  apiAction(api => api.QualificationPaths.ListQualificationScopes(req))

export type ListQualificationScopesRequest = InferEndpointRequest<
  typeof ListQualificationScopesEndpoint
>

export type ListQualificationScopesRes = Effect.Success<ReturnType<typeof listQualificationScopes>>

export type ListQualificationScopesError = Effect.Error<ReturnType<typeof listQualificationScopes>>

export const resolveQualificationPath = (req: ResolveQualificationPathRequest) =>
  apiAction(api => api.QualificationPaths.ResolveQualificationPath(req))

export type ResolveQualificationPathRequest = InferEndpointRequest<
  typeof ResolveQualificationPathEndpoint
>

export type ResolveQualificationPathRes = Effect.Success<
  ReturnType<typeof resolveQualificationPath>
>

export type ResolveQualificationPathError = Effect.Error<
  ReturnType<typeof resolveQualificationPath>
>
