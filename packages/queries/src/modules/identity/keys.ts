import type {
  GetOptionalCurrentSessionRequest,
  GetCurrentSessionRequest,
} from '@inzpro/api-client/modules/identity'

export const identityKeys = {
  all: ['identity'] as const,
  session: () => [...identityKeys.all, 'session'] as const,
  getOptionalCurrentSession: (req: GetOptionalCurrentSessionRequest) =>
    [...identityKeys.session(), 'getOptionalCurrentSession', req] as const,
  getCurrentSession: (req: GetCurrentSessionRequest) =>
    [...identityKeys.session(), 'getCurrentSession', req] as const,
}
