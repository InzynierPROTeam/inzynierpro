import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  completeOnboarding,
  type CompleteOnboardingRequest,
} from '@inzpro/api-client/modules/preparation'
import { apiHttpClient } from '~platform/lib/api-client'

export const submitOnboarding = (req: CompleteOnboardingRequest) =>
  runApi(completeOnboarding(req), apiHttpClient)
