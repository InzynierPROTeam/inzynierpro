import type {
  ListSpecializationsRequest,
  ListQualificationKindsRequest,
  ListQualificationScopesRequest,
  ResolveQualificationPathRequest,
} from '@inzpro/api-client/modules/qualification-paths'

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
