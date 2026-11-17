import type { CheckHealthRequest } from '@inzpro/api-client/modules/health'

export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
  checkHealth: (req: CheckHealthRequest) => [...healthKeys.status(), 'checkHealth', req] as const,
}
