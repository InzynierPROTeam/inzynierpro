import {
  listSpecializations,
  type ListSpecializationsRequest,
  listQualificationKinds,
  type ListQualificationKindsRequest,
  listQualificationScopes,
  type ListQualificationScopesRequest,
  resolveQualificationPath,
  type ResolveQualificationPathRequest,
} from '@inzpro/api-client/modules/qualification-paths'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

export const qualificationPathsKeys = {
  all: ['qualification-paths'] as const,
  specializations: () => [...qualificationPathsKeys.all, 'specializations'] as const,
  qualificationKinds: () => [...qualificationPathsKeys.all, 'qualificationKinds'] as const,
  qualificationScopes: () => [...qualificationPathsKeys.all, 'qualificationScopes'] as const,
  resolve: () => [...qualificationPathsKeys.all, 'resolve'] as const,
  listSpecializations: (req: ListSpecializationsRequest) =>
    [...qualificationPathsKeys.specializations(), 'listSpecializations', req] as const,
  listSpecializationsInfinite: (req: ListSpecializationsRequest) =>
    [...qualificationPathsKeys.listSpecializations(req), 'infinite'] as const,
  listQualificationKinds: (req: ListQualificationKindsRequest) =>
    [...qualificationPathsKeys.qualificationKinds(), 'listQualificationKinds', req] as const,
  listQualificationKindsInfinite: (req: ListQualificationKindsRequest) =>
    [...qualificationPathsKeys.listQualificationKinds(req), 'infinite'] as const,
  listQualificationScopes: (req: ListQualificationScopesRequest) =>
    [...qualificationPathsKeys.qualificationScopes(), 'listQualificationScopes', req] as const,
  listQualificationScopesInfinite: (req: ListQualificationScopesRequest) =>
    [...qualificationPathsKeys.listQualificationScopes(req), 'infinite'] as const,
  resolveQualificationPath: (req: ResolveQualificationPathRequest) =>
    [...qualificationPathsKeys.resolve(), 'resolveQualificationPath', req] as const,
}

export const specializationsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListSpecializationsRequest,
) =>
  effectInfiniteQueryOptions(
    qualificationPathsKeys.listSpecializationsInfinite(req),
    cursor => listSpecializations({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const qualificationKindsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListQualificationKindsRequest,
) =>
  effectInfiniteQueryOptions(
    qualificationPathsKeys.listQualificationKindsInfinite(req),
    cursor => listQualificationKinds({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const qualificationScopesInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListQualificationScopesRequest,
) =>
  effectInfiniteQueryOptions(
    qualificationPathsKeys.listQualificationScopesInfinite(req),
    cursor => listQualificationScopes({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const resolveQualificationPathQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ResolveQualificationPathRequest,
) =>
  effectQueryOptions(
    qualificationPathsKeys.resolveQualificationPath(req),
    resolveQualificationPath(req),
    httpClient,
  )

export const specializationsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListSpecializationsRequest,
) =>
  effectQueryOptions(
    qualificationPathsKeys.listSpecializations(req),
    listSpecializations(req),
    httpClient,
  )

export const qualificationKindsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListQualificationKindsRequest,
) =>
  effectQueryOptions(
    qualificationPathsKeys.listQualificationKinds(req),
    listQualificationKinds(req),
    httpClient,
  )

export const qualificationScopesQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListQualificationScopesRequest,
) =>
  effectQueryOptions(
    qualificationPathsKeys.listQualificationScopes(req),
    listQualificationScopes(req),
    httpClient,
  )
